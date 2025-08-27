import fs from "fs";
import { calcAbilityModifier, formatCR, parseCR, proficiencyByCR, extractFirstParagraph } from "#utils";

const VERSION = "1.2"; // Версия скрипта

// Загружаем JSON из файла
const rawTia = fs.readFileSync("./jsons/Tiamat.json", "utf-8");
const rawBan = fs.readFileSync("./jsons/Bandit.json", "utf-8");
const rawTor = fs.readFileSync("./jsons/Tortle.json", "utf-8");
const rawNec = fs.readFileSync("./jsons/Necromancer.json", "utf-8");
const npcTia = JSON.parse(rawTia);
const npcTor = JSON.parse(rawTor);
const npcBan = JSON.parse(rawBan);
const npcNec = JSON.parse(rawNec);
const npcs = [npcTia, npcTor, npcBan, npcNec];

function renderCard(npc) {
  const sys = npc.system || {};

  // Характеристики (если есть)
  const abilities = sys.abilities
    ? [
        ["С", calcAbilityModifier(sys.abilities.str?.value)],
        ["Л", calcAbilityModifier(sys.abilities.dex?.value)],
        ["Т", calcAbilityModifier(sys.abilities.con?.value)],
        ["И", calcAbilityModifier(sys.abilities.int?.value)],
        ["М", calcAbilityModifier(sys.abilities.wis?.value)],
        ["Х", calcAbilityModifier(sys.abilities.cha?.value)],
      ].filter(([_, v]) => v != null)
    : [];

  // Основные статы
  const hp = sys.attributes?.hp?.value;
  let ac = sys.attributes?.ac?.flat ?? sys.attributes?.ac?.calc;
  switch (ac) {
    case "default":
      const armor = npc.items.find(i => i.type === "armor")?.system?.armor?.value || 10;
      ac = armor + calcAbilityModifier(sys.abilities?.dex?.value);
      break;

    default:
      // ac = 10 + calcAbilityModifier(sys.abilities?.dex?.value);
      break;
  }

  let speed = "";
  for (const key in sys.attributes?.movement ?? {}) {
    if (typeof sys.attributes.movement[key] === "number" && sys.attributes.movement[key] !== 0) {
      switch (key) {
        case "burrow":
          speed = speed + ` коп ${sys.attributes.movement[key]},`;
          break;

        case "climb":
          speed = speed + ` лаз ${sys.attributes.movement[key]},`;
          break;

        case "fly":
          speed = speed + ` полет ${sys.attributes.movement[key]},`;
          break;

        case "swim":
          speed = speed + ` плав ${sys.attributes.movement[key]},`;
          break;

        case "walk":
          speed = speed + ` ${sys.attributes.movement[key]}фт`;
          break;

        default:
          break;
      }
    }
  }

  // Атаки = предметы-оружие
  const attacks = (npc.items || [])
    .filter(i => i.type === "weapon")
    .map(w => {
      const has =
        sys.abilities[
          w?.system?.ability
            ? w.system.ability
            : w.system?.properties?.some(w => w === "amm" || w === "fin")
            ? "dex"
            : "str"
        ].value;
      // Если есть фехтовальное или боеприпас - то ловкость
      let attribute = calcAbilityModifier(has);

      let dmg = w.system?.damage?.parts?.[0] || [];

      dmg = dmg.join(" ").trim().replace(/\s+/g, " ").replace("@mod", attribute) || "—";

      return {
        name: w.name,
        bonus: w.system?.attackBonus ?? attribute + proficiencyByCR(sys.details?.cr),
        damage: dmg,
      };
    });

  const multiAttackRaw = (npc.items || []).find(i => i.name === "Мультиатака")?.system?.description?.value;
  const multiAttack = multiAttackRaw ? extractFirstParagraph(multiAttackRaw) : "";

  // Способности (feats и classFeatures)
  const abilitiesList = (npc.items || []).filter(i => ["feat", "classFeature"].includes(i.type)).map(f => f.name);

  // Заметки
  const notes = sys.details?.biography?.value || sys.details?.type?.value || "";

  return `
    <div class="card">
      <h6>${npc.name}</h6>

      ${
        abilities.length
          ? `<div class="attributes">
          ${abilities
            .map(
              ([k, v]) => `
            <div class="attribute">
              <span>${k}</span> <span>${v}</span>
            </div>
          `,
            )
            .join("")}
        </div>`
          : ""
      }

      ${
        hp || ac || speed
          ? `<div class="section">
          ${hp ? `ХП: ${hp}` : ""} 
          ${ac ? `КД: ${ac}` : ""} 
          ${speed ? `СК: ${speed}` : ""}
        </div>`
          : ""
      }

      ${
        attacks.length
          ? `<div class="section">
        <b>Атаки: ${multiAttack}</b>
        <ul>
          ${attacks.map(a => `<li>${a.name} ${a.bonus ? `(${a.bonus})` : ""} — ${a.damage}</li>`).join("")}
        </ul>
      </div>`
          : ""
      }

      ${
        abilitiesList.length
          ? `<div class="section">
        <b>Способности:</b>
        <ul>
          ${abilitiesList.map(ab => `<li>${ab}</li>`).join("")}
        </ul>
      </div>`
          : ""
      }

    </div>
  `;
}

function generateHTML(npcs) {
  const html = `
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        align-items: flex-start;
        gap: 16px;
        padding: 16px;
      }
      .card {
        width: 250px;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
      }
      .card h6 { margin: 0; font-size: 18px; }
      .attributes {
        margin-top: 6px;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        padding: 0 8px;
      }
      .attribute {
        display: flex;
        flex-direction: column;
        background: #f0f0f0;
        padding: 6px;
        gap: 2px;
        border-radius: 12px;
        text-align: center;
      }
      .section { margin-top: 8px; font-size: 14px; }
      ul { margin: 4px 0; padding-left: 18px; }
    </style>
  </head>
  <body>
    ${npcs.map(renderCard).join("")}
  </body>
  </html>
  `;
  fs.writeFileSync("npcs.html", html, "utf-8");
}

generateHTML(npcs);

// const npcsData = [
//   {
//     name: "Гракх",
//     race: "Орк",
//     role: "Наёмник",
//     stats: { hp: 45, ac: 14, speed: "30 ft" },
//     abilitiesScores: { С: 4, Л: 0, Т: 5, И: -1, М: 3, Х: -2 },
//     attacks: [
//       { name: "Топор", bonus: "+5", damage: "1d12+3" },
//       { name: "Пинок", bonus: "+3", damage: "1d6+2" },
//     ],
//     abilities: ["Ярость: +2 к урону, если меньше половины HP", "Устрашение: враг делает спасбросок WIS"],
//     notes: "Предпочитает ближний бой, боится магии.",
//   },
//   {
//     name: "Серин",
//     race: "Эльф",
//     role: "Лучница",
//     stats: { hp: 28, ac: 16, speed: "35 ft" },
//     abilitiesScores: { С: 1, Л: 4, Т: 0, И: 3, М: 2, Х: 1 },
//     attacks: [
//       { name: "Лук", bonus: "+6", damage: "1d8+4" },
//       { name: "Кинжал", bonus: "+4", damage: "1d4+2" },
//     ],
//     abilities: ["Скрытность: advantage на Stealth", "Меткий выстрел: +2 к урону дальнобойным оружием"],
//     notes: "Осторожна, предпочитает атаковать из укрытия.",
//   },
// ];

// function renderCardFromScrap(npc) {
//   const abilitiesHeader = "С Л Т И М Х";
//   const abilitiesValues = `${npc.abilitiesScores.S} ${npc.abilitiesScores.L} ${npc.abilitiesScores.T} ${npc.abilitiesScores.I} ${npc.abilitiesScores.M} ${npc.abilitiesScores.X}`;

//   Object.keys(npc.abilitiesScores).forEach;

//   return `
//     <div class="card">
//       <h2>${npc.name}</h2>
//       <div><i>${npc.race} — ${npc.role}</i></div>

//       <div class="attributes">
//         ${Object.entries(npc.abilitiesScores)
//           .map(
//             ([key, value]) => `
//           <div class="attribute">
//             <span>${key}</span> <span>${value}</span>
//           </div>
//         `,
//           )
//           .join("")}
//       </div>

//       <div class="section">
//         <b>Статы:</b><br>
//         HP: ${npc.stats.hp}, AC: ${npc.stats.ac}, Speed: ${npc.stats.speed}
//       </div>

//       <div class="section">
//         <b>Атаки:</b>
//         <ul>
//           ${npc.attacks.map(a => `<li>${a.name} (${a.bonus}) — ${a.damage}</li>`).join("")}
//         </ul>
//       </div>

//       <div class="section">
//         <b>Способности:</b>
//         <ul>
//           ${npc.abilities.map(ab => `<li>${ab}</li>`).join("")}
//         </ul>
//       </div>

//       <div class="section">
//         <b>Заметки:</b> ${npc.notes}
//       </div>
//     </div>
//   `;
// }

// function generateHTMLFromScrap(npcs) {
//   const html = `
//   <html>
//   <head>
//     <meta charset="utf-8"/>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         display: flex;
//         flex-wrap: wrap;
//         align-content: flex-start;
//         gap: 16px;
//         padding: 16px;
//       }

//       .card {
//         width: 250px;
//         border: 2px solid #333;
//         border-radius: 8px;
//         padding: 10px;
//         box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
//       }

//       .card h2 {
//         margin: 0;
//         font-size: 18px;
//       }

//       .abilities {
//         margin-top: 6px;
//         font-size: 14px;
//       }

//       .attributes {
//         margin-top: 6px;
//         font-size: 14px;
//         display: flex;
//         justify-content: space-between;
//       }

//       .attribute {
//         display: flex;
//         flex-direction: column;
//         background: #f0f0f0;
//         padding: 8px;
//         gap: 4px;
//         border-radius: 20px;
//         text-align: center;
//       }

//       .section {
//         margin-top: 8px;
//         font-size: 14px;
//       }

//       ul {
//         margin: 4px 0;
//         padding-left: 18px;
//       }
//     </style>
//   </head>
//   <body>
//     ${npcsData.map(renderCardFromScrap).join("")}
//   </body>
//   </html>
//   `;
//   fs.writeFileSync("npcs.html", html, "utf-8");
// }

// generateHTMLFromScrap(npcsData);

import fs from "fs";

const npcs = [
  {
    name: "Гракх",
    race: "Орк",
    role: "Наёмник",
    stats: { hp: 45, ac: 14, speed: "30 ft" },
    abilitiesScores: { С: 4, Л: 0, Т: 5, И: -1, М: 3, Х: -2 },
    attacks: [
      { name: "Топор", bonus: "+5", damage: "1d12+3" },
      { name: "Пинок", bonus: "+3", damage: "1d6+2" },
    ],
    abilities: ["Ярость: +2 к урону, если меньше половины HP", "Устрашение: враг делает спасбросок WIS"],
    notes: "Предпочитает ближний бой, боится магии.",
  },
  {
    name: "Серин",
    race: "Эльф",
    role: "Лучница",
    stats: { hp: 28, ac: 16, speed: "35 ft" },
    abilitiesScores: { С: 1, Л: 4, Т: 0, И: 3, М: 2, Х: 1 },
    attacks: [
      { name: "Лук", bonus: "+6", damage: "1d8+4" },
      { name: "Кинжал", bonus: "+4", damage: "1d4+2" },
    ],
    abilities: ["Скрытность: advantage на Stealth", "Меткий выстрел: +2 к урону дальнобойным оружием"],
    notes: "Осторожна, предпочитает атаковать из укрытия.",
  },
];

function renderCard(npc) {
  const abilitiesHeader = "С Л Т И М Х";
  const abilitiesValues = `${npc.abilitiesScores.S} ${npc.abilitiesScores.L} ${npc.abilitiesScores.T} ${npc.abilitiesScores.I} ${npc.abilitiesScores.M} ${npc.abilitiesScores.X}`;

  Object.keys(npc.abilitiesScores).forEach;

  return `
    <div class="card">
      <h2>${npc.name}</h2>
      <div><i>${npc.race} — ${npc.role}</i></div>

      <div class="attributes">
        ${Object.entries(npc.abilitiesScores)
          .map(
            ([key, value]) => `
          <div class="attribute">
            <span>${key}</span> <span>${value}</span>
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="section">
        <b>Статы:</b><br>
        HP: ${npc.stats.hp}, AC: ${npc.stats.ac}, Speed: ${npc.stats.speed}
      </div>

      <div class="section">
        <b>Атаки:</b>
        <ul>
          ${npc.attacks.map(a => `<li>${a.name} (${a.bonus}) — ${a.damage}</li>`).join("")}
        </ul>
      </div>

      <div class="section">
        <b>Способности:</b>
        <ul>
          ${npc.abilities.map(ab => `<li>${ab}</li>`).join("")}
        </ul>
      </div>

      <div class="section">
        <b>Заметки:</b> ${npc.notes}
      </div>
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
        gap: 16px;
        padding: 16px;
      }

      .card {
        width: 250px;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
      }

      .card h2 {
        margin: 0;
        font-size: 18px;
      }

      .abilities {
        margin-top: 6px;
        font-size: 14px;
      }

      .attributes {
        margin-top: 6px;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
      }

      .attribute {
        display: flex;
        flex-direction: column;
        background: #f0f0f0;
        padding: 8px;
        gap: 4px;
        border-radius: 20px;
        text-align: center;
      }

      .section {
        margin-top: 8px;
        font-size: 14px;
      }

      ul {
        margin: 4px 0;
        padding-left: 18px;
      }
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

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActivityType } from 'discord.js';
import config from './config.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let KiwizBot;
(async () => {
  KiwizBot = (await import('kiwizbot-prevnames')).default;
})();

client.once('ready', async () => {
  console.log('KiwizBot API Request Client By Kiwiz!');
  console.log(`[BOT] -> Logged in as ${client.user.tag}!`);
  console.log(`[BOT] -> Actual Bot Version: 1.1.0`);

  const activities = [
    { name: `KiwizBot API Client By Kiwiz!`, type: ActivityType.Custom },
  ];

  let activityIndex = 0;

  setInterval(() => {
    const currentActivity = activities[activityIndex];
    client.user.setPresence({
      activities: [currentActivity],
      status: 'dnd',
    });

    activityIndex = (activityIndex + 1) % activities.length;
  }, 5000);

  const commands = [
    new SlashCommandBuilder()
      .setName('prevnames')
      .setDescription('Fetch Prevnames of a user.')
      .addStringOption(option =>
        option.setName('user_id')
          .setDescription('The ID of the user to look up')
          .setRequired(true)),
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
  } catch (error) {
    console.error('Error setting up commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'prevnames') {
    const userId = interaction.options.getString('user_id');

    if (!userId) {
      await interaction.reply('Please provide a user ID.');
      return;
    }

    try {
      const data = await KiwizBot.prevnames(userId);

      const embed = new EmbedBuilder()
        .setTitle('KiwizBot API Request')
        .setTimestamp();

      if (data && data.pseudonyms && Array.isArray(data.pseudonyms) && data.pseudonyms.length > 0) {
        data.pseudonyms.forEach(entry => {
          if (entry.old_name && entry.timestamp) {
            embed.addFields({
              name: entry.old_name,
              value: new Date(parseInt(entry.timestamp) * 1000).toLocaleString(),
              inline: false
            });
          } else {
            console.warn('Invalid entry:', entry);
          }
        });
      } else {
        embed.setDescription('No prevnames found for this user.');
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching prevnames:', error);
      await interaction.reply('There was an error fetching the prevnames.');
    }
  }
});

client.login(config.token);

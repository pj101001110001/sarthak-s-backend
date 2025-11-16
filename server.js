require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.static('public'));

const DISCORD_BOT_TOKEN = process.env.BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
});

client.login(DISCORD_BOT_TOKEN);

client.once('ready', () => {
  console.log('Bot logged in:', client.user.tag);
});

app.get('/api/discord-stats', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();

    
    const restRes = await axios.get(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}?with_counts=true`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );

    const restData = restRes.data;

    res.json({
      serverName: guild.name,
      totalMembers: restData.approximate_member_count ?? guild.memberCount,
      onlineMembers: restData.approximate_presence_count ?? guild.approximatePresenceCount,
      boostLevel: restData.premium_tier,
      boostCount: restData.premium_subscription_count,
      channels: channels.size,
      channelList: channels.map(ch => ({ id: ch.id, name: ch.name, type: ch.type })),
      roles: roles.size,
      serverIcon: guild.iconURL?.({ size: 256 }) ?? null,
      createdAt: guild.createdAt
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

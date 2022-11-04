const axios = require('axios');
const ChannelModel = require('./models/channel');
const CHANNELS = require('./channels.json');

function generateBaseLine(type) {
  const channel = CHANNELS[type];

  const baseInfoArray = ["#EXTINF:-1"];
  if (channel.id) { baseInfoArray.push(`tvg-id="${channel.id}"`); }
  if (channel.name) { baseInfoArray.push(`tvg-name="${channel.name}"`); }
  if (channel.group) { baseInfoArray.push(`group-title="${channel.group}"`); }
  if (channel.parentCode) { baseInfoArray.push(`parent-code="${channel.parentCode}"`); }
  if (channel.audio) { baseInfoArray.push(`audio-track="${channel.audio}"`); }

  let baseInfoText = `${baseInfoArray.join(' ')},`;
  if (channel.title) { baseInfoText += `${channel.title}`; }
  return baseInfoText;
}

// https://siptv.eu/howto/playlist.html
async function getPlaylistFileContent() {
  const channels = await ChannelModel.find({ }).exec();
  const arr = ['#EXTM3U'];

  Object.keys(CHANNELS).forEach(type => {
    const dbChannel = channels.find(c => c.type === type);
    if (dbChannel) {
      const baseLine = generateBaseLine(type);
      arr.push(baseLine, dbChannel.url);
    }
  });

  const body = arr.join('\n');
  return body;
}

async function deletePlaylist(type) {
  await ChannelModel.deleteMany({ type }).exec();
}

async function upsertRawPlaylist(type, url) {
  await deletePlaylist(type)
  const ch = new ChannelModel({ type, url });
  await ch.save();
}

async function manageRawPlaylist(type, url) {
  const response = await axios.get(url);
  if (response.status === 200) {
    await upsertRawPlaylist(type, url);
  } else {
    await deletePlaylist(type);
  }
}

async function manageYoutubePlaylist(type, id) {
  const body = {
    "context": {
      "client": {
        "hl": "en",
        "clientName": "WEB",
        "clientVersion": "2.20210721.00.00",
        "mainAppWebInfo": {
          "graftUrl": `/watch?v=${id}`
        }
      }
    },
    "videoId": id
  }
  const response = await axios.post("https://youtubei.googleapis.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", body);
  if (response && response.data && response.data.streamingData && response.data.streamingData.hlsManifestUrl) {
    const url = response.data.streamingData.hlsManifestUrl;
    await manageRawPlaylist(type, url);
  } else {
    await deletePlaylist(type);
  }
}

async function manageWebPlaylist(type, webUrl, pattern) {
  const response = await axios.get(webUrl);
  const regex = new RegExp(pattern);
  const regexResult = regex.exec(response.data);
  if (regexResult.length >= 2) {
    let url = regex.exec(response.data)[1];
    url = url.replace(/\\/g, '');
    await manageRawPlaylist(type, url);
  } else {
    await deletePlaylist(type);
  }
}

async function manageTrtPlaylist() {
  const response = await axios.get('https://trtizle-api.cdn.wp.trt.com.tr/trttv/v3/livestream');
  const tvChannels = response.data.tvChannels;
  const eduChannels = response.data.eduChannels;

  const trt1 = tvChannels.find(x => x.path === "/canli/tv/trt-1");
  const trt2 = tvChannels.find(x => x.path === "/canli/tv/trt-2");
  const trtBelgesel = tvChannels.find(x => x.path === "/canli/tv/trt-belgesel");
  const trtHaber = tvChannels.find(x => x.path === "/canli/tv/trt-haber");
  const trtSpor = tvChannels.find(x => x.path === "/canli/tv/trt-spor");
  const trtSporYildiz = tvChannels.find(x => x.path === "/canli/tv/trt-spor-yildiz");
  const trtMuzik = tvChannels.find(x => x.path === "/canli/tv/trt-muzik");
  const trtCocuk = tvChannels.find(x => x.path === "/canli/tv/trt-cocuk");
  const trtTurk = tvChannels.find(x => x.path === "/canli/tv/trt-turk");
  const trtAvaz = tvChannels.find(x => x.path === "/canli/tv/trt-avaz");
  const trtKurdi = tvChannels.find(x => x.path === "/canli/tv/trt-kurdi");
  const trtArabi = tvChannels.find(x => x.path === "/canli/tv/trt-arabi");
  const trtWorld = tvChannels.find(x => x.path === "/canli/tv/trt-world");
  const ebaIlkokul = eduChannels.find(x => x.path === "/canli/tv/trt-eba-ilkokul");
  const ebaOrtaokul = eduChannels.find(x => x.path === "/canli/tv/trt-eba-ortaokul");
  const ebaLise = eduChannels.find(x => x.path === "/canli/tv/trt-eba-lise");

  const promises = [
    manageRawPlaylist(CHANNELS.Trt1, trt1.url),
    manageRawPlaylist(CHANNELS.Trt2, trt2.url),
    manageRawPlaylist(CHANNELS.TrtBelgesel, trtBelgesel.url),
    manageRawPlaylist(CHANNELS.TrtHaber, trtHaber.url),
    manageRawPlaylist(CHANNELS.TrtSpor, trtSpor.url),
    manageRawPlaylist(CHANNELS.TrtSporYildiz, trtSporYildiz.url),
    manageRawPlaylist(CHANNELS.TrtMuzik, trtMuzik.url),
    manageRawPlaylist(CHANNELS.TrtCocuk, trtCocuk.url),
    manageRawPlaylist(CHANNELS.TrtTurk, trtTurk.url),
    manageRawPlaylist(CHANNELS.TrtAvaz, trtAvaz.url),
    manageRawPlaylist(CHANNELS.TrtKurdi, trtKurdi.url),
    manageRawPlaylist(CHANNELS.TrtArabi, trtArabi.url),
    manageRawPlaylist(CHANNELS.TrtWorld, trtWorld.url),
    manageRawPlaylist(CHANNELS.EbaIlkokul, ebaIlkokul.url),
    manageRawPlaylist(CHANNELS.EbaOrtaokul, ebaOrtaokul.url),
    manageRawPlaylist(CHANNELS.EbaLise, ebaLise.url),
  ];
  await Promise.all(promises);
}

module.exports = {
  getPlaylistFileContent,
  manageRawPlaylist,
  manageYoutubePlaylist,
  manageWebPlaylist,
  manageTrtPlaylist
}
const connectToDatabase = require('./db')
const { getPlaylistFileContent, manageYoutubePlaylist, manageWebPlaylist, manageRawPlaylist } = require('./utils');

module.exports.channels = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  const body = await getPlaylistFileContent();
  return { statusCode: 200, body };
};

module.exports.youtube = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  await manageYoutubePlaylist(process.env.TYPE, process.env.ID);
  return { statusCode: 200, body: true };
};

module.exports.rawWeb = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  await manageWebPlaylist(process.env.TYPE, process.env.URL, process.env.REGEX);
  return { statusCode: 200, body: true };
};

module.exports.rawPlaylist = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  await manageRawPlaylist(process.env.TYPE, process.env.URL);
  return { statusCode: 200, body: true };
};

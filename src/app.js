const dotenv = require('dotenv');
// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

const restify = require('restify');
const builder = require('botbuilder');

const Wit = require('node-wit').Wit;

// my commands
const FindImgCmd = require('./find_img_cmd');
// response
const response = require('./response');
const data = response.data;
// message router
const MessageRouter = require('./message_router');
// wit.ai entities processor
const EntitiesProcessor = require('./entities_processor');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const witToken = {
  server: process.env.WIT_SERVER_ACCESS_TOKEN,
  appid: process.env.WIT_APP_ID,
};

//-----------------------

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// wit client
const witClient = new Wit({
  accessToken: witToken.server
});

const drinkHandler = (entities) => {
  if (!entities.drink) {
    throw new Error('No drink here');
  }
  // get max confidence intent
  let drinkIntent = entities.drink
    .filter(d => d.confidence>=0.9)
    .reduce((max, next) => Math.max(next.confidence, max.confidence), entities.drink[0]);
  
  if (!drinkIntent) {
    throw new Error('We don\'t have enough confidence for drink')
  }
  // check drink action
  let action = drinkIntent.value
}

// simple processors
const simpleProcessor = {action: (session, msg) => session.endDialog(msg)};
// validate the wit.ai response
const validateWitAIMsg = (data,entity,value) => {
  if (!data || !data.entities || !data.entities[entity]) {
    throw new Error('This is not `'+entity+'` entity');
  }
  const e = data.entities[entity].reduce( (max, f) => { 
    return (f.confidence < max.confidence)?f:max;
  }, data.entities[entity][0])

  if (!e || value != e['value']) {
    throw new Error('Not enough confidence or not '+value);
  }

  return e;
}

const computeMsgDrinkLocation = (data) => {
  validateWitAIMsg(data, "drink", "drink.location");
  return response.pickRan(response.data.drinkLocation);
};

const computeMsgSwearMe = (data) => {
  validateWitAIMsg(data, "swear", "swear.me");
  return response.pickRan(response.data.swearMe);
};

const computeMsgConversationGreeting = (data) => {
  validateWitAIMsg(data, "conversation", "conversation.greeting");
  return response.pickRan(response.data.conversationGreeting);
}

// entities processor
const iProcessor = new EntitiesProcessor();
// - complex command
iProcessor.register(FindImgCmd);
// - simple command
iProcessor.register(simpleProcessor, computeMsgDrinkLocation)
iProcessor.register(simpleProcessor, computeMsgSwearMe)
iProcessor.register(simpleProcessor, computeMsgConversationGreeting)
// default - return confuse
iProcessor.register(simpleProcessor, data => response.pickRan(response.data.confuse));

// router
const witAiHandler = {
  action: (session, msg) => {
    // --------------- processing using available ML wit.ai
    witClient.message(msg, {})
      .then(function (res) {
        iProcessor.process(session, res)
      })
      .catch(function (err) {
        console.error("This should not happened, but seem we still having error.", err);
        session.endDialog(response.pickRan(response.data.bug)+"\n"+JSON.stringify(err, Object.keys(err)));
      });
  }
};

const helpHandler = {
  action: (session, msg) => {
    session.endDialog(" Hướng dẫn là hong có hướng dẫn :D.")
  }
}

const router = new MessageRouter();

// Order matters!
router.register(/^tét hình .*$/, FindImgCmd);
router.register(/^hép .*$/, helpHandler);
router.register(/.*/, witAiHandler);

// ok bot
const bot = new builder.UniversalBot(connector, [
  function (session) {
    session.beginDialog('default');
  }
]);

// ------------ Bot event handler
bot.on('contactRelationUpdate', function (message) {
  if (message.action === 'add') {
    const name = message.user ? message.user.name : null;
    const reply = new builder.Message()
      .address(message.address)
      .text("Chào anh %s... em là %s", name || 'ấy', message.address.bot.name || 'bum búm');
    bot.send(reply);
  } else {
    // delete their data
  }
});

// ------------ Bot default handler
bot.dialog('default', function (session) {
  let msg = session.message.text;
  msg = removeBotInformation(session.message.address.bot, msg);
  router.handle(session, msg);
});

function removeBotInformation(bot, msg) {
  if (bot) {
    return msg
      .replace("@" + bot.name, "").trim()
      .replace("@" + bot.id, "").trim()
      .replace("@Ruồi Sờ Là Cai", "").trim(); // still need to remove cached old name
  }

  return msg;
}

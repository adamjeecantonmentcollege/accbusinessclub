const { corsMiddleware } = require("./middleware/cors.middleware");
const { errorMiddleware, notFound } = require("./middleware/error.middleware");
const { healthRouter, registrationRouter, membersRouter, imagesRouter } = require("./endpoints");

function createApp() {
  const app = require("express")();
  // healthRouter must stay BEFORE corsMiddleware: CORS-free liveness probe
  app.use(healthRouter);
  app.use(corsMiddleware);
  app.use(require("express").json());
  app.use(imagesRouter);
  app.use(registrationRouter);
  app.use(membersRouter);
  app.use(notFound);
  app.use(errorMiddleware);
  return app;
}

module.exports = { createApp };

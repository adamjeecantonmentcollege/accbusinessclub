// Router registry — mounts only, no logic.
module.exports = {
  healthRouter: require("./health"),
  registrationRouter: require("./registration"),
  membersRouter: require("./members"),
  imagesRouter: require("./images"),
};

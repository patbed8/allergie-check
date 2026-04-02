const { withPodfile } = require('@expo/config-plugins')

// Sets the `platform :ios` line in the Podfile to the given deployment target.
// expo-build-properties only updates the Xcode project, not the Podfile — this
// plugin handles the Podfile side, which is what CocoaPods reads.
module.exports = function withPodfileDeploymentTarget(config, { deploymentTarget }) {
  return withPodfile(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /platform :ios, ['"][^'"]+['"]/,
      `platform :ios, '${deploymentTarget}'`
    )
    return config
  })
}

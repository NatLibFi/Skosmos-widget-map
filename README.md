# Skosmos plugin for displaying a map on concept pages
This plugin will show a map with a marker centered at concept coordinates (determined by the values of predicates `wgs84:lat` and `wgs84:long`), if existing. Lazy loading is applied if the widget is in closed state.

# Installation
1. git clone to Skosmos plugins directory

2. run `npm ci` (or `npm install` if npm version is below v5.7.1) in the cloned directory

# Linting JavaScript
1. Skosmos and its npm packages should be installed ([See instructions](https://github.com/NatLibFi/Skosmos/wiki/InstallTutorial))

2. check validity of code by running checkJS.sh script in plugin directory with path to Skosmos directory
   
3. to fix errors run script again with argument `--fix`

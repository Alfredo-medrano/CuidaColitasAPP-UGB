// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver problema de compatibilidad con el módulo 'util'
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    // Usar la versión de util compatible con React Native
    'util': require.resolve('util/'),
};

// Forzar resolución de módulos problemáticos
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Ignorar el import problemático de util/support/types
    if (moduleName === './support/types' && context.originModulePath.includes('node_modules/util')) {
        return {
            type: 'empty',
        };
    }

    // Usar el resolver por defecto para todo lo demás
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

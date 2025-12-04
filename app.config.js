import 'dotenv/config';

const getUpdatesUrl = () => {
  return "https://u.expo.dev/c15b9c5a-73d2-4e4b-a275-c9c049d5c414";
};

export default {
  "expo": {
    "name": "Supabase",
    "slug": "Supabase",
    "scheme": "supabaseapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/Perrito_blanco.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./src/assets/welcome.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/Bacuna.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ],
      "package": "com.pyas.Supabase"
    },
    "web": {
      "favicon": "./src/assets/banner.png"
    },
    "extra": {
      "supabaseUrl": process.env.SUPABASE_URL,
      "supabaseAnonKey": process.env.SUPABASE_ANON_KEY,
      "eas": {
        projectId: "7824a741-b330-4397-a258-20917c7e80d9"
      }
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "La aplicación necesita acceso a tus fotos para que puedas seleccionar un avatar."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./src/assets/Perrito_blanco.png",
          "color": "#0B8FAC",
          "defaultChannel": "default",
          "sounds": []
        }
      ],
      "expo-font"
    ],
    "updates": {
      "url": getUpdatesUrl()
    }
  }
};
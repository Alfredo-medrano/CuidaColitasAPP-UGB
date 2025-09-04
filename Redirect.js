import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './Supabase';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import ResetPassword from './screens/Auth/ResetPassword';
import Home from './screens/Home';
import SignIn from './screens/Auth/Signin';

const navigationRef = createNavigationContainerRef();

export default function Redirect() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {

    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        if (navigationRef.isReady()) {
          navigationRef.navigate('ResetPassword');
        }
      }
    });

    const handleUrl = ({ url }) => {
      if (url.includes('supabaseapp://reset')) {
        if (navigationRef.isReady()) {
          navigationRef.navigate('ResetPassword');
        }
      } else {
        supabase.auth.exchangeCodeForSession(url);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('URL inicial recibida:', url);
        if (url.includes('supabaseapp://reset')) {
          if (navigationRef.isReady()) {
            navigationRef.navigate('ResetPassword');
          }
        } else {
          supabase.auth.exchangeCodeForSession(url);
        }
      }
    });

    const linkSub = Linking.addEventListener('url', handleUrl);

    return () => {
      sub.subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {session ? <Home /> : <SignIn />}
    </NavigationContainer>
  );
}

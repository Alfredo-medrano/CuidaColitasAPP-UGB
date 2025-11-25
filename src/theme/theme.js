export const COLORS = {
  primary: '#013847',
  card: '#027A74',
  accent: '#43C0AF',
  secondary: '#A8E6DC',
  textPrimary: '#DFF6F2',
  alert: '#CDA37B',
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF1744',

  lightRed: 'rgba(255, 23, 68, 0.1)',
  lightBlue: 'rgba(67, 192, 175, 0.1)',
  lightGreen: 'rgba(29, 234, 155, 0.1)',
};

export const FONTS = {
  PoppinsRegular: 'Poppins-Regular',
  PoppinsSemiBold: 'Poppins-SemiBold',
  PoppinsBold: 'Poppins-Bold',
};

export const SIZES = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 14,
  caption: 12,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 5,
  },
  dark: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.48,
    shadowRadius: 11.95,
    elevation: 10,
  },
};
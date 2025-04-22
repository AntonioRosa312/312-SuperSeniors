export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'golf-green': '#3D7F42',  // Rich golf-course green
        'golf-yellow': '#F4D03F', // Golf ball color
        'sand-bunker': '#F1E2B8', // Sand color for background effects
      },
      keyframes: {
        moveCloud1: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(110vw)' },
        },
        moveCloud2: {
          '0%': { transform: 'translateX(-150px)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        moveCloud3: {
          '0%': { transform: 'translateX(-300px)' },
          '100%': { transform: 'translateX(120vw)' },
        },
        moveCloud4: {
          '0%': { transform: 'translateX(-180px)' },
          '100%': { transform: 'translateX(90vw)' },
        },
        moveCloud5: {
          '0%': { transform: 'translateX(-100px)' },
          '100%': { transform: 'translateX(80vw)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-10deg)' },
        },
      },
      animation: {
        cloud1: 'moveCloud1 60s linear infinite',
        cloud2: 'moveCloud2 80s linear infinite',
        cloud3: 'moveCloud3 70s linear infinite',
        cloud4: 'moveCloud4 50s linear infinite',
        cloud5: 'moveCloud5 90s linear infinite',
        wiggle: 'wiggle 1.5s ease-in-out infinite',
      },
      clipPath: {
        cloud1: 'polygon(50% 0%, 60% 20%, 70% 15%, 80% 30%, 100% 20%, 90% 40%, 85% 60%, 70% 80%, 50% 100%, 30% 80%, 15% 60%, 10% 40%, 0% 20%)',
        cloud2: 'polygon(60% 0%, 70% 20%, 85% 10%, 100% 30%, 90% 50%, 60% 60%, 40% 50%, 30% 30%, 20% 40%, 10% 20%)',
        cloud3: 'polygon(40% 0%, 60% 10%, 75% 20%, 90% 40%, 70% 50%, 50% 60%, 30% 50%, 15% 30%, 0% 10%)',
        cloud4: 'polygon(30% 0%, 50% 20%, 60% 40%, 70% 50%, 90% 30%, 80% 10%, 60% 10%, 50% 30%, 40% 40%)',
        cloud5: 'polygon(50% 0%, 55% 15%, 70% 25%, 85% 20%, 80% 40%, 60% 50%, 50% 40%, 30% 30%, 10% 20%)',
        cloud6: 'polygon(10% 0%, 30% 10%, 40% 40%, 60% 50%, 80% 60%, 90% 30%, 70% 20%, 40% 30%, 30% 20%)',
        cloud7: 'polygon(20% 0%, 40% 10%, 60% 30%, 50% 50%, 40% 40%, 20% 20%)',
        cloud8: 'polygon(15% 0%, 35% 10%, 55% 15%, 65% 40%, 50% 60%, 30% 50%, 15% 40%)',
        cloud9: 'polygon(30% 0%, 50% 10%, 60% 30%, 50% 40%, 40% 30%, 20% 20%)',
        cloud10: 'polygon(0% 0%, 20% 10%, 40% 20%, 50% 40%, 30% 50%, 10% 30%)',
        cloud11: 'polygon(10% 0%, 30% 20%, 40% 30%, 50% 40%, 60% 30%, 50% 20%, 40% 10%)',
        cloud12: 'polygon(30% 0%, 50% 10%, 60% 20%, 80% 30%, 70% 50%, 40% 60%, 30% 50%)',
        cloud13: 'polygon(10% 0%, 20% 10%, 40% 20%, 60% 30%, 80% 40%, 70% 50%, 40% 60%, 20% 40%)',
        cloud14: 'polygon(10% 0%, 30% 10%, 50% 20%, 60% 30%, 70% 40%, 50% 50%, 40% 40%)',
        cloud15: 'polygon(0% 0%, 10% 10%, 20% 20%, 30% 30%, 50% 40%, 70% 30%, 90% 20%, 80% 10%)',
        cloud16: 'polygon(20% 0%, 40% 10%, 60% 30%, 50% 40%, 30% 50%, 10% 40%)',
        cloud17: 'polygon(30% 0%, 40% 10%, 60% 20%, 70% 30%, 50% 50%, 30% 40%)',
      },
    },
  },
  plugins: [],
}

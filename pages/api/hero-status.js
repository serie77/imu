export default function handler(req, res) {
  try {
    // Try to import the Hero packages
    const heroPackage = require('@ulixee/hero');
    const heroCorePackage = require('@ulixee/hero-core');
    
    const Hero = heroPackage.Hero || heroPackage.default;
    const HeroCore = heroCorePackage.Hero || heroCorePackage.default;
    
    // Return information about the packages
    return res.status(200).json({
      status: 'success',
      heroPackage: {
        type: typeof heroPackage,
        keys: Object.keys(heroPackage),
        heroType: typeof Hero
      },
      heroCorePackage: {
        type: typeof heroCorePackage,
        keys: Object.keys(heroCorePackage),
        heroCoreType: typeof HeroCore
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
} 
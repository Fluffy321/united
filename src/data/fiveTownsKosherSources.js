const FIVE_TOWNS_VAAD = 'Five Towns Vaad';

const vaad = (slug) => ({
  kosher: true,
  kosher_certifier: FIVE_TOWNS_VAAD,
  kosher_source_url: `https://vaadhakashrus.org/listing/${slug}/`,
});

const directorySource = (certifier, sourceUrl) => ({
  kosher: true,
  kosher_certifier: `${certifier} · directory source`,
  kosher_source_url: sourceUrl,
});

// Certification links are intentionally separate from general listing sources.
// Every restaurant displayed by JUnited must have a current, clickable kosher source.
export const FIVE_TOWNS_KOSHER_SOURCES = {
  'food-graze-smokehouse': vaad('graze-smokehouse'),
  'food-central-pizza': vaad('central-pizza-co'),
  'food-sunflower-lawrence': vaad('sunflower-cafe'),
  'food-smash-house': vaad('smash-house'),
  'food-barbacoa': vaad('barbacoa-burger-house'),
  'food-stop-wok-roll': vaad('stop-wok-roll'),
  'food-cork-slice': vaad('cork-slice'),
  'food-chickies': vaad('chickies'),
  'food-central-perk': vaad('central-perk'),
  'food-cafe-chocolat': vaad('cafe-chocolat'),
  'food-kiss-cafe': directorySource('Five Towns Vaad', 'https://kosherpo.com/id/kiss-cafe'),
  'food-the-shoppe': vaad('the-shoppe'),
  'food-traditions-lawrence': vaad('traditions-restaurant'),
  'food-ahuvas-grill': vaad('ahuvas-grill-express'),
  'food-mg-craft-kitchen': vaad('mgcarftkitchen'),
  'food-laffa-bar-hewlett': vaad('laffa-bar-grill'),
  'food-that-sushi-spot': vaad('that-sushi-spot'),
  'food-pizzale': vaad('pizzale'),
  'food-upper-crust': vaad('the-upper-crust'),
  'food-holy-schnitzel': vaad('holy-schnitzel'),
  'food-bogo-pizza': vaad('bogo-pizza'),
  'food-cho-sen-island': vaad('cho-sen-island'),
  'food-sushi-tokyo-five-towns': vaad('sushi-tokyo'),
  'food-stop-chop-roll': vaad('stop-chop-roll'),
  'food-carlos-gabbys': directorySource('Five Towns Vaad', 'https://koshernyc.org/restaurant/carlos-and-gabby-s-cantina-grill'),
  'food-ondas-fuego': vaad('ondas-by-fuego'),
  'food-anju-modern-asian': vaad('anju'),
  'food-seasons-express-lawrence': vaad('seasons-express-2'),
  'vaad-bean-and-berry': vaad('beanandberry'),
  'vaad-bellagio-cafe': vaad('bellagio'),
  'vaad-berrylicious': vaad('berrylicious-3'),
  'vaad-bravo-kosher-pizza': vaad('bravo-kosher-pizza'),
  'vaad-burger-spot': vaad('burger-spot'),
  'vaad-capri': vaad('capri'),
};

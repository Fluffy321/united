import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PIN_TYPES = {
  shul: { label: 'Shuls', color: '#4f46e5', short: 'S' },
  school: { label: 'Schools / Yeshivas', color: '#0ea5e9', short: 'SC' },
  restaurant: { label: 'Restaurants', color: '#f97316', short: 'R' },
  grocery: { label: 'Grocery', color: '#16a34a', short: 'G' },
  bakery: { label: 'Bakery', color: '#d97706', short: 'B' },
  judaica: { label: 'Judaica', color: '#2563eb', short: 'J' },
  business: { label: 'Businesses', color: '#0f766e', short: '$' },
  services: { label: 'Services', color: '#0891b2', short: 'SV' },
  wellness: { label: 'Wellness', color: '#be123c', short: 'W' },
  lost_found: { label: 'Lost & Found', color: '#9333ea', short: 'L' },
  help_needed: { label: 'Help Needed', color: '#dc2626', short: 'H' },
  mitzvah_available: { label: 'Mitzvahs Available', color: '#16a34a', short: 'M' },
  event: { label: 'Events', color: '#0891b2', short: 'E' },
  community_post: { label: 'My Communities', color: '#0f5ed7', short: 'C' },
  other: { label: 'Other', color: '#64748b', short: 'O' },
};

const PRIMARY_FILTERS = [
  { key: 'shuls', label: 'Shuls', types: ['shul'] },
  { key: 'restaurants', label: 'Restaurants', types: ['restaurant'] },
  { key: 'kosher_food', label: 'Kosher Food', types: ['restaurant', 'grocery', 'bakery'] },
  { key: 'businesses', label: 'Businesses', types: ['judaica', 'business', 'services', 'wellness'] },
  { key: 'schools_yeshivas', label: 'Schools / Yeshivas', types: ['school'] },
  { key: 'mitzvot', label: 'Mitzvot', types: ['help_needed', 'mitzvah_available', 'lost_found'] },
];

const CLUSTER_BUCKET_SCALE = 1000;
const CLUSTER_BASE_RADIUS = 0.00042;

const STATIC_POINTS = [
  {
    id: 'shul-yilc',
    title: 'Young Israel of Lawrence-Cedarhurst',
    description: 'Shul, minyanim, learning, and community updates.',
    type: 'shul',
    location_text: '8 Spruce St, Cedarhurst',
    location_lat: 40.6221,
    location_lng: -73.7272,
    verification: 'Community directory',
    source_url: 'https://www.yilc.org/',
  },
  {
    id: 'shul-nusach-ari',
    title: 'Congregation Nusach Ari of the 5 Towns',
    description: 'Lubavitch/Chabad-style Shabbos minyan in Cedarhurst. Public site lists congregation details.',
    type: 'shul',
    location_text: '112 Spruce St, Cedarhurst',
    location_lat: 40.6221,
    location_lng: -73.7275,
    verification: 'Community directory',
    source_url: 'https://www.nusachari5towns.com/about-us',
  },
  {
    id: 'shul-chabad-five-towns',
    title: 'Chabad of the Five Towns',
    description: 'Chabad center serving the Five Towns with Jewish education, classes, and community support.',
    type: 'shul',
    location_text: '74 Maple Ave, Cedarhurst',
    location_lat: 40.6208,
    location_lng: -73.7269,
    verification: 'Community directory',
    source_url: 'https://www.chabadli.org/templates/articlecco_cdo/aid/242877/jewish/Chabad-of-the-Five-Towns.htm',
  },
  {
    id: 'shul-woodmere',
    title: 'Young Israel of Woodmere',
    description: 'Shul hub for tefillah, shiurim, and local announcements.',
    type: 'shul',
    location_text: '859 Peninsula Blvd, Woodmere',
    location_lat: 40.6317,
    location_lng: -73.7074,
    verification: 'Community directory',
    source_url: 'https://www.yiwoodmere.org/',
  },
  {
    id: 'shul-aish-kodesh',
    title: 'Congregation Aish Kodesh',
    description: 'Woodmere shul and Torah community with public congregation site and address.',
    type: 'shul',
    location_text: '894 Woodmere Pl, Woodmere',
    location_lat: 40.6321,
    location_lng: -73.7067,
    verification: 'Community directory',
    source_url: 'https://www.aishkodesh.org/',
  },
  {
    id: 'shul-bais-tefila',
    title: 'Congregation Bais Tefila',
    description: 'Woodmere shul listed publicly with minyanim and community information.',
    type: 'shul',
    location_text: '409 Edward Ave, Woodmere',
    location_lat: 40.6309,
    location_lng: -73.7154,
    verification: 'Community directory',
    source_url: 'https://www.baistefila.org/',
  },
  {
    id: 'shul-yih',
    title: 'Young Israel of Hewlett',
    description: 'Young Israel shul serving Hewlett families with tefillah and community programming.',
    type: 'shul',
    location_text: '1 Piermont Ave, Hewlett',
    location_lat: 40.6416,
    location_lng: -73.7031,
    verification: 'Community directory',
    source_url: 'https://www.yihe.org/',
  },
  {
    id: 'shul-bais-tefila-inwood',
    title: 'Bais Tefila of Inwood',
    description: 'Orthodox community shul for Inwood with weekday and Shabbos minyanim.',
    type: 'shul',
    location_text: '259 Doughty Blvd, Inwood',
    location_lat: 40.6229,
    location_lng: -73.7458,
    verification: 'Community directory',
    source_url: 'https://www.inwoodshul.com/contact-us',
  },
  {
    id: 'shul-marina-inwood',
    title: 'JCCI / The Marina Shul of Inwood',
    description: 'Inwood shul and Jewish community center listed publicly on local Jewish directories.',
    type: 'shul',
    location_text: '44 Bayswater Blvd, Inwood',
    location_lat: 40.6179,
    location_lng: -73.7449,
    verification: 'Community directory',
    source_url: 'https://dafyomidirectory.org/shiur-location/jcci-the-marina-shul-of-inwood/',
  },
  {
    id: 'shul-agudah-five-towns',
    title: 'Agudath Israel of the Five Towns',
    description: 'Cedarhurst shul listed in the Five Towns shuls and minyanim directory.',
    type: 'shul',
    location_text: '508 Peninsula Blvd, Cedarhurst',
    location_lat: 40.6242,
    location_lng: -73.7255,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-bais-haknesses-north-woodmere',
    title: 'Bais Haknesses of North Woodmere',
    description: 'North Woodmere shul listed with local minyan and community information.',
    type: 'shul',
    location_text: '649 Hungry Harbor Rd, North Woodmere',
    location_lat: 40.6473,
    location_lng: -73.7294,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-young-israel-north-woodmere',
    title: 'Young Israel of North Woodmere',
    description: 'North Woodmere Young Israel shul with minyanim, shiurim, and community programming.',
    type: 'shul',
    location_text: '634 Hungry Harbor Rd, North Woodmere',
    location_lat: 40.6471,
    location_lng: -73.7298,
    verification: 'Community directory',
    source_url: 'https://www.yinw.org/',
  },
  {
    id: 'shul-bais-medrash-cedarhurst',
    title: 'Bais Medrash of Cedarhurst',
    description: 'Cedarhurst beis medrash listed in the local shuls directory.',
    type: 'shul',
    location_text: '504 West Broadway, Cedarhurst',
    location_lat: 40.6234,
    location_lng: -73.7359,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-harborview-lawrence',
    title: 'Bais Medrash of Harborview',
    description: 'Lawrence shul serving the Harborview area.',
    type: 'shul',
    location_text: '218 Harborview South, Lawrence',
    location_lat: 40.6096,
    location_lng: -73.7249,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-bais-ment-lawrence',
    title: 'Bais Ment - Zichron Dovid & Sora Schwartz',
    description: 'Lawrence shul listed in the Five Towns directory.',
    type: 'shul',
    location_text: '6 Herrik Dr, Lawrence',
    location_lat: 40.6059,
    location_lng: -73.7278,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-bais-tefila-north-woodmere',
    title: 'Bais Tefillah of North Woodmere',
    description: 'North Woodmere shul listed with local community information.',
    type: 'shul',
    location_text: '1000 Rosedale Rd, North Woodmere',
    location_lat: 40.6536,
    location_lng: -73.7286,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-heichal-dovid-lawrence',
    title: 'Beis Medrash Heichal Dovid',
    description: 'The W Shul in Lawrence, listed in the local shuls directory.',
    type: 'shul',
    location_text: '215 Central Ave, Lawrence',
    location_lat: 40.6149,
    location_lng: -73.7328,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-beit-midrash-hachaim-vehashalom',
    title: 'Beit Midrash Hachaim VeHashalom',
    description: 'Cedarhurst Sephardic beit midrash listed with local shul information.',
    type: 'shul',
    location_text: '530 Central Ave, Cedarhurst',
    location_lat: 40.6215,
    location_lng: -73.7246,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-bostoner-lawrence',
    title: 'Bostoner Bais Medrash of Lawrence',
    description: 'Lawrence shul listed in the Five Towns shuls and minyanim directory.',
    type: 'shul',
    location_text: '1109 Doughty Blvd, Lawrence',
    location_lat: 40.6265,
    location_lng: -73.7429,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-chabad-hewlett',
    title: 'Chabad of Hewlett',
    description: 'Chabad center serving Hewlett with tefillah, Torah classes, and community programming.',
    type: 'shul',
    location_text: '31 Franklin Ave, Hewlett',
    location_lat: 40.6415,
    location_lng: -73.6963,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-chofetz-chaim-cedarhurst',
    title: 'Chofetz Chaim Torah Center',
    description: 'Cedarhurst Torah center and shul listed in the local directory.',
    type: 'shul',
    location_text: '7 Derby Ave, Cedarhurst',
    location_lat: 40.6263,
    location_lng: -73.7241,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-anshei-chesed-hewlett',
    title: 'Congregation Anshei Chesed',
    description: 'Hewlett congregation listed with local shul information.',
    type: 'shul',
    location_text: '1170 William St, Hewlett',
    location_lat: 40.6396,
    location_lng: -73.7042,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-bais-avrohom-zev-lawrence',
    title: 'Congregation Bais Avrohom Zev',
    description: "Rabbi Gruber's Shul in Lawrence, listed in the Five Towns directory.",
    type: 'shul',
    location_text: '2 Rockaway Turnpike, Lawrence',
    location_lat: 40.6079,
    location_lng: -73.7466,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-island-woodmere',
    title: 'Congregation Bais Ephraim Yitzchok',
    description: 'Island Shul in Woodmere, listed publicly with local shul details.',
    type: 'shul',
    location_text: '812 Peninsula Blvd, Woodmere',
    location_lat: 40.6318,
    location_lng: -73.7089,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-beth-sholom-lawrence',
    title: 'Congregation Beth Sholom',
    description: 'Lawrence congregation listed with shul and community information.',
    type: 'shul',
    location_text: '390 Broadway, Lawrence',
    location_lat: 40.6178,
    location_lng: -73.7297,
    verification: 'Community directory',
    source_url: 'https://www.bethsholomlawrence.org/',
  },
  {
    id: 'shul-ohr-torah-north-woodmere',
    title: 'Congregation Ohr Torah',
    description: 'North Woodmere congregation listed in the Five Towns shuls directory.',
    type: 'shul',
    location_text: '410 Hungry Harbor Rd, North Woodmere',
    location_lat: 40.6448,
    location_lng: -73.7227,
    verification: 'Community directory',
    source_url: 'https://ohrtorah.org/contact-us',
  },
  {
    id: 'shul-shaaray-tefilah-lawrence',
    title: 'Congregation Shaaray Tefilah',
    description: 'Lawrence shul listed with local minyan and congregation information.',
    type: 'shul',
    location_text: '25 Central Ave, Lawrence',
    location_lat: 40.6127,
    location_lng: -73.7376,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-tifereth-zvi-cedarhurst',
    title: 'Congregation Tifereth Zvi',
    description: 'Cedarhurst congregation listed in the local shuls and minyanim directory.',
    type: 'shul',
    location_text: '26 Columbia Ave, Cedarhurst',
    location_lat: 40.6231,
    location_lng: -73.7292,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-kehilas-bais-yisroel',
    title: 'Kehilas Bais Yisroel',
    description: 'Cedarhurst shul listed in the Five Towns shuls directory.',
    type: 'shul',
    location_text: '352 West Broadway, Cedarhurst',
    location_lat: 40.6238,
    location_lng: -73.7327,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-ahavas-yisrael-cedarhurst',
    title: 'Kehillas Ahavas Yisrael',
    description: 'Cedarhurst shul on Peninsula Boulevard listed in the local directory.',
    type: 'shul',
    location_text: '568 Peninsula Blvd, Cedarhurst',
    location_lat: 40.6252,
    location_lng: -73.7235,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-red-shul-cedarhurst',
    title: 'Kehillas Bais Yehudah Tzvi',
    description: 'The Red Shul in Cedarhurst, listed with local community information.',
    type: 'shul',
    location_text: '391 Oakland Ave, Cedarhurst',
    location_lat: 40.6233,
    location_lng: -73.7249,
    verification: 'Community directory',
    source_url: 'https://www.kbyt.org/',
  },
  {
    id: 'shul-bnei-hayeshivos-north-woodmere',
    title: 'Kehillas Bnei Hayeshivos',
    description: 'North Woodmere shul listed in the Five Towns shuls directory.',
    type: 'shul',
    location_text: '790 Van Dam St, North Woodmere',
    location_lat: 40.6517,
    location_lng: -73.7283,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-shaare-emunah-cedarhurst',
    title: 'Shaare Emunah, Sephardic Congregation of Five Towns',
    description: 'Sephardic congregation in Cedarhurst listed in the local shuls directory.',
    type: 'shul',
    location_text: '539 Oakland Ave, Cedarhurst',
    location_lat: 40.6254,
    location_lng: -73.7241,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-woodsburgh-minyan',
    title: 'Woodsburgh Minyan',
    description: 'Woodsburgh minyan listed with local shul information.',
    type: 'shul',
    location_text: '850 Keene Ln, Woodsburgh',
    location_lat: 40.6252,
    location_lng: -73.7117,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'shul-back-lawrence-minyan',
    title: 'Zichron Meir Moshe',
    description: 'Back Lawrence Minyan listed in the Five Towns shuls directory.',
    type: 'shul',
    location_text: '431 Mistletoe Way, Lawrence',
    location_lat: 40.6034,
    location_lng: -73.7207,
    verification: 'Community directory',
    source_url: 'https://www.5towns.biz/home/directory-category/shuls/',
  },
  {
    id: 'school-haftr',
    title: 'HAFTR',
    description: 'Hebrew Academy of the Five Towns and Rockaway. Jewish day school serving preschool through high school.',
    type: 'school',
    location_text: '389 Central Ave, Lawrence / 635 Central Ave, Cedarhurst',
    location_lat: 40.6129,
    location_lng: -73.7307,
    verification: 'School directory',
    source_url: 'https://haftr.org/',
  },
  {
    id: 'school-halb',
    title: 'HALB Elementary',
    description: 'Hebrew Academy of Long Beach elementary school division in Woodmere.',
    type: 'school',
    location_text: '523 Church Ave, Woodmere',
    location_lat: 40.6347,
    location_lng: -73.7137,
    verification: 'School directory',
    source_url: 'https://www.halb.org/',
  },
  {
    id: 'school-drs',
    title: 'DRS Yeshiva High School for Boys',
    description: 'HALB high school division for boys, listed by HALB at its Woodmere campus.',
    type: 'school',
    location_text: '700 Ibsen St, Woodmere',
    location_lat: 40.6327,
    location_lng: -73.7075,
    verification: 'School directory',
    source_url: 'https://www.halb.org/',
  },
  {
    id: 'school-ska',
    title: 'SKA High School for Girls',
    description: 'HALB high school division for girls, listed by HALB at Hewlett Bay Park campus.',
    type: 'school',
    location_text: '291 Meadowview Ave, Hewlett Bay Park',
    location_lat: 40.6302,
    location_lng: -73.6959,
    verification: 'School directory',
    source_url: 'https://www.halb.org/',
  },
  {
    id: 'school-shulamith',
    title: 'Shulamith School for Girls',
    description: 'Jewish girls school in Cedarhurst. Public school site lists Cedarhurst campus.',
    type: 'school',
    location_text: '305 Cedarhurst Ave, Cedarhurst',
    location_lat: 40.6227,
    location_lng: -73.7276,
    verification: 'School directory',
    source_url: 'https://www.shulamith.org/',
  },
  {
    id: 'school-ygft',
    title: 'Yeshiva Gedolah of the Five Towns',
    description: 'Yeshiva and Torah center in Woodmere. Public site lists 218 Mosher Ave.',
    type: 'school',
    location_text: '218 Mosher Ave, Woodmere',
    location_lat: 40.6274,
    location_lng: -73.7131,
    verification: 'School directory',
    source_url: 'https://ygft.org/',
  },
  {
    id: 'school-yoss',
    title: 'Yeshiva of South Shore',
    description: 'Yeshiva in Hewlett. Public site lists William Street campus.',
    type: 'school',
    location_text: '1170 William St, Hewlett',
    location_lat: 40.6396,
    location_lng: -73.7042,
    verification: 'School directory',
    source_url: 'https://yoss.org/contact-us/',
  },
  {
    id: 'food-graze-smokehouse',
    title: 'Graze Smokehouse',
    description: 'Verified kosher smokehouse. Source says OU certified and under Vaad Hakashrus of Five Towns Far Rockaway.',
    type: 'restaurant',
    location_text: '529 Central Ave, Cedarhurst',
    location_lat: 40.6224,
    location_lng: -73.7272,
    verification: 'Verified kosher',
    source_url: 'https://grazebrands.com/graze-smokehouse',
  },
  {
    id: 'food-central-pizza',
    title: 'Central Pizza Co',
    description: 'Verified kosher pizza and dairy restaurant. Listed under Vaad of the Five Towns and Far Rockaway.',
    type: 'restaurant',
    location_text: '608 Central Ave, Cedarhurst',
    location_lat: 40.6222,
    location_lng: -73.7254,
    verification: 'Verified kosher',
    source_url: 'https://mekomos.com/restaurants/central-pizza-co/',
  },
  {
    id: 'food-sunflower-lawrence',
    title: 'Sunflower Cafe Lawrence',
    description: 'Verified kosher dairy cafe. Site states certified kosher under Vaad Hakashrus.',
    type: 'restaurant',
    location_text: '357 Central Ave, Lawrence',
    location_lat: 40.6134,
    location_lng: -73.7297,
    verification: 'Verified kosher',
    source_url: 'https://sunflowercafe.com/sunflower-cafe-lawrence-dairy-cafe-coffee-catering/',
  },
  {
    id: 'food-wok-tov',
    title: 'Wok Tov',
    description: 'Verified kosher Chinese restaurant. KosherPo lists Vaad Hakashrus of Five Towns.',
    type: 'restaurant',
    location_text: '594 Central Ave, Cedarhurst',
    location_lat: 40.6223,
    location_lng: -73.7258,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/wok-tov',
  },
  {
    id: 'food-smash-house',
    title: 'Smash House Burger',
    description: 'Verified kosher burger restaurant. Great Kosher Restaurants lists Vaad of the Five Towns supervision.',
    type: 'restaurant',
    location_text: '594 Central Ave, Cedarhurst',
    location_lat: 40.62245,
    location_lng: -73.72595,
    verification: 'Verified kosher',
    source_url: 'https://www.greatkosherrestaurants.com/restaurants-az/smash-house-burger-5-towns/',
  },
  {
    id: 'food-mamoosh',
    title: 'Mamoosh',
    description: 'Verified kosher Mediterranean/shawarma restaurant. KosherPo lists Vaad Hakashrus of Five Towns.',
    type: 'restaurant',
    location_text: '450C Rockaway Turnpike, Cedarhurst',
    location_lat: 40.6277,
    location_lng: -73.7387,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/mamoosh',
  },
  {
    id: 'food-barbacoa',
    title: 'Barbacoa',
    description: 'Verified kosher burger/steak restaurant. GoKosher lists Vaad of Five Towns.',
    type: 'restaurant',
    location_text: '142 Spruce St, Cedarhurst',
    location_lat: 40.6218,
    location_lng: -73.7278,
    verification: 'Verified kosher',
    source_url: 'https://www.gokosher.com/en/f97597',
  },
  {
    id: 'food-stop-wok-roll',
    title: 'Stop Wok & Roll',
    description: 'Verified kosher restaurant. KosherPo lists Vaad Hakashrus of Five Towns.',
    type: 'restaurant',
    location_text: '121 Cedarhurst Ave, Cedarhurst',
    location_lat: 40.6222,
    location_lng: -73.7262,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/stop-wok-roll',
  },
  {
    id: 'food-cork-slice',
    title: 'Cork & Slice',
    description: 'Verified kosher dairy/Italian restaurant. Site and GoKosher list Vaad of Five Towns supervision.',
    type: 'restaurant',
    location_text: '477 Chestnut St, Cedarhurst',
    location_lat: 40.6242,
    location_lng: -73.7245,
    verification: 'Verified kosher',
    source_url: 'https://www.corkandslice.com/',
  },
  {
    id: 'food-chickies',
    title: 'Chickies Five Towns',
    description: 'Verified kosher fast food/chicken restaurant. Public listing and site identify it as kosher.',
    type: 'restaurant',
    location_text: '566 Central Ave, Cedarhurst',
    location_lat: 40.62235,
    location_lng: -73.7266,
    verification: 'Verified kosher',
    source_url: 'https://orderchickies.com/our-story',
  },
  {
    id: 'food-central-perk',
    title: 'Central Perk Cafe',
    description: 'Verified kosher cafe. KosherPo lists Vaad Hakashrus of Five Towns.',
    type: 'restaurant',
    location_text: '105 Cedarhurst Ave, Cedarhurst',
    location_lat: 40.6227,
    location_lng: -73.7257,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/central-perk-cafe',
  },
  {
    id: 'food-cafe-chocolat',
    title: 'Cafe Chocolat',
    description: 'Verified kosher cafe/dairy restaurant. Mekomos lists Vaad of the Five Towns supervision.',
    type: 'restaurant',
    location_text: '556 Central Ave, Cedarhurst',
    location_lat: 40.6224,
    location_lng: -73.7268,
    verification: 'Verified kosher',
    source_url: 'https://mekomos.com/restaurants/cafe-chocolat/',
  },
  {
    id: 'food-kiss-cafe',
    title: 'Kiss Cafe',
    description: 'Verified kosher cafe. KosherPo lists Vaad Hakashrus of Five Towns.',
    type: 'restaurant',
    location_text: '500R Central Ave, Cedarhurst',
    location_lat: 40.6227,
    location_lng: -73.7282,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/kiss-cafe',
  },
  {
    id: 'food-the-shoppe',
    title: 'The Shoppe Restaurant',
    description: 'Verified kosher meat restaurant. Public listing names Vaad Hakashrus of Five Towns & Far Rockaway supervision.',
    type: 'restaurant',
    location_text: '550 Central Ave, Cedarhurst',
    location_lat: 40.6225,
    location_lng: -73.7269,
    verification: 'Verified kosher',
    source_url: 'https://www.totallyjewishtravel.com/Kosher_Restaurant-TE52652-the_shoppe_restaurant_formerly_five_fifty-Reviews-cedarhurst_new_york.html',
  },
  {
    id: 'food-traditions-lawrence',
    title: 'Traditions Eatery',
    description: 'Verified kosher restaurant in Lawrence. Public listings identify it as kosher and show the Lawrence address.',
    type: 'restaurant',
    location_text: '302 Central Ave, Lawrence',
    location_lat: 40.6126,
    location_lng: -73.7311,
    verification: 'Verified kosher',
    source_url: 'https://www.traditionseatery.com/',
  },
  {
    id: 'food-ahuvas-grill',
    title: "Ahuva's Grill",
    description: 'Verified kosher restaurant in Lawrence. Public kosher listings identify Vaad of Five Towns supervision.',
    type: 'restaurant',
    location_text: '480 Rockaway Tpke, Lawrence',
    location_lat: 40.6171,
    location_lng: -73.7377,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/ahuvas-grill',
  },
  {
    id: 'food-mg-craft-kitchen',
    title: 'MG Craft Kitchen',
    description: 'Verified kosher restaurant on Lawrence/Far Rockaway border. Public listings identify kosher supervision.',
    type: 'restaurant',
    location_text: '20 Lawrence Ave, Lawrence',
    location_lat: 40.6098,
    location_lng: -73.7404,
    verification: 'Verified kosher',
    source_url: 'https://www.greatkosherrestaurants.com/restaurants-az/mg-craft-kitchen/',
  },
  {
    id: 'food-gottlieb-fish',
    title: "Gottlieb's Fish",
    description: 'Kosher fish and takeout shop serving Lawrence/Cedarhurst. Public listings identify kosher offerings.',
    type: 'grocery',
    location_text: '314 Central Ave, Lawrence',
    location_lat: 40.6163,
    location_lng: -73.7313,
    verification: 'Kosher shop listing',
    source_url: 'https://www.gottliebsfish.com/',
  },
  {
    id: 'food-woodro-hearth',
    title: 'Woodro Kosher Delicatessen & Restaurant',
    description: 'Verified kosher deli/restaurant in Hewlett. Public site and listings identify it as kosher.',
    type: 'restaurant',
    location_text: '1039 Broadway, Hewlett',
    location_lat: 40.6392,
    location_lng: -73.7015,
    verification: 'Verified kosher',
    source_url: 'https://woodrokosher.com/',
  },
  {
    id: 'food-laffa-bar-hewlett',
    title: 'Laffa Bar & Grill',
    description: 'Verified kosher Israeli grill in Hewlett. Public kosher listings identify it as kosher.',
    type: 'restaurant',
    location_text: '1326 Peninsula Blvd, Hewlett',
    location_lat: 40.6433,
    location_lng: -73.6965,
    verification: 'Verified kosher',
    source_url: 'https://www.laffabarandgrill.com/',
  },
  {
    id: 'food-geffen-gourmet',
    title: 'Geffen Gourmet',
    description: 'Kosher prepared foods and catering shop in Hewlett/Five Towns area.',
    type: 'grocery',
    location_text: '407 Mill Rd, Hewlett',
    location_lat: 40.6384,
    location_lng: -73.7006,
    verification: 'Kosher shop listing',
    source_url: 'https://geffengourmetny.com/contact-us/',
  },
  {
    id: 'food-that-sushi-spot',
    title: 'That Sushi Spot',
    description: 'Kosher sushi restaurant in Woodmere. Public kosher listings identify Vaad of Five Towns supervision.',
    type: 'restaurant',
    location_text: '1058 Broadway, Woodmere',
    location_lat: 40.6397,
    location_lng: -73.7011,
    verification: 'Verified kosher',
    source_url: 'https://www.greatkosherrestaurants.com/restaurants-az/that-sushi-spot/',
  },
  {
    id: 'food-gotta-getta-bagel',
    title: 'Gotta Getta Bagel',
    description: 'Kosher bagel and cafe spot serving Woodmere/Five Towns.',
    type: 'bakery',
    location_text: '1039 Broadway, Woodmere',
    location_lat: 40.6392,
    location_lng: -73.7015,
    verification: 'Kosher shop listing',
    source_url: 'https://gottagettabagelny.com/',
  },
  {
    id: 'food-bagel-boss-hewlett',
    title: 'Bagel Boss Hewlett',
    description: 'Kosher bagel shop in Hewlett. Public store listing identifies kosher bakery/catering.',
    type: 'bakery',
    location_text: '1352 Peninsula Blvd, Hewlett',
    location_lat: 40.6434,
    location_lng: -73.6956,
    verification: 'Kosher shop listing',
    source_url: 'https://www.bagelboss.com/',
  },
  {
    id: 'food-zomicks-bakery',
    title: "Zomick's Bakery",
    description: 'Kosher bakery in Inwood. Public kosher listings identify the Inwood bakery address.',
    type: 'bakery',
    location_text: '85 Inip Dr, Inwood',
    location_lat: 40.6282,
    location_lng: -73.7494,
    verification: 'Kosher shop listing',
    source_url: 'https://kosherpo.com/id/zomicks',
  },
  {
    id: 'food-glicks-bakehouse',
    title: 'Glicks Bakehouse',
    description: 'Verified kosher bakery in Cedarhurst. Public listing names Vaad Hakashrus of Five Towns & Far Rockaway supervision.',
    type: 'bakery',
    location_text: '140E Washington Ave, Cedarhurst',
    location_lat: 40.6226,
    location_lng: -73.7292,
    verification: 'Verified kosher',
    source_url: 'https://www.totallyjewishtravel.com/Kosher_Restaurant-TE67479-glicks_bakehouse-Reviews-cedarhurst_new_york.html',
  },
  {
    id: 'food-pizzale',
    title: "Pizza'le",
    description: 'Verified kosher pizza, sushi, and dairy restaurant. Great Kosher Restaurants lists Vaad of Five Towns and Far Rockaway.',
    type: 'restaurant',
    location_text: '560 Central Ave, Cedarhurst',
    location_lat: 40.62235,
    location_lng: -73.72655,
    verification: 'Verified kosher',
    source_url: 'https://www.greatkosherrestaurants.com/restaurants-az/pizzale/',
  },
  {
    id: 'food-uncle-mochi',
    title: 'Uncle Mochi Cafe',
    description: 'Kosher cafe in the Five Towns offering coffee, desserts, pastries, and dairy dishes.',
    type: 'bakery',
    location_text: '456 Central Ave, Cedarhurst',
    location_lat: 40.6227,
    location_lng: -73.729,
    verification: 'Kosher cafe listing',
    source_url: 'https://myunclemochi.com/uncle-mochi-cafe/',
  },
  {
    id: 'food-upper-crust',
    title: 'Upper Crust Five Towns',
    description: 'Verified kosher pizza/dairy restaurant. Site states Vaad Hakashrus of the Five Towns & Far Rockaway.',
    type: 'restaurant',
    location_text: '442 Central Ave, Cedarhurst',
    location_lat: 40.6229,
    location_lng: -73.7295,
    verification: 'Verified kosher',
    source_url: 'https://grazebrands.com/upper-crust',
  },
  {
    id: 'food-holy-schnitzel',
    title: 'Holy Schnitzel Five Towns',
    description: 'Kosher fast-casual meat restaurant. Official site lists the Cedarhurst location under Vaad of Five Towns & Rockaway supervision.',
    type: 'restaurant',
    location_text: '688 Central Ave, Cedarhurst',
    location_lat: 40.6221,
    location_lng: -73.7238,
    verification: 'Verified kosher',
    source_url: 'https://holyshnitzel.com/',
  },
  {
    id: 'food-bogo-pizza',
    title: 'Bogo Kosher Pizza',
    description: 'Kosher pizzeria. KosherPo lists Vaad Hakashrus of Five Towns and Far Rockaway certification.',
    type: 'restaurant',
    location_text: '206 Rockaway Turnpike, Cedarhurst',
    location_lat: 40.6243,
    location_lng: -73.7429,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/bogo-kosher-pizza',
  },
  {
    id: 'food-cho-sen-island',
    title: 'Cho-Sen Island',
    description: 'Kosher Chinese and sushi restaurant in Lawrence. KosherPo lists Vaad Hakashrus of Five Towns supervision.',
    type: 'restaurant',
    location_text: '367 Central Ave, Lawrence',
    location_lat: 40.6134,
    location_lng: -73.7293,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/cho-sen-island',
  },
  {
    id: 'food-sushi-tokyo-five-towns',
    title: 'Sushi Tokyo Five Towns',
    description: 'Kosher sushi restaurant in Lawrence. I Keep Kosher lists Vaad Five Towns Far Rockaway supervision.',
    type: 'restaurant',
    location_text: '337 Central Ave, Lawrence',
    location_lat: 40.6131,
    location_lng: -73.7302,
    verification: 'Verified kosher',
    source_url: 'https://ikeepkosher.com/listing/sushi-tokyo-five-towns/',
  },
  {
    id: 'food-stop-chop-roll',
    title: 'Stop Chop & Roll',
    description: 'Kosher sushi/Japanese restaurant. KosherPo lists Vaad Hakashrus of Five Towns supervision.',
    type: 'restaurant',
    location_text: '19 Cedarhurst Ave, Cedarhurst',
    location_lat: 40.6226,
    location_lng: -73.7265,
    verification: 'Verified kosher',
    source_url: 'https://kosherpo.com/id/stop-chop-roll',
  },
  {
    id: 'food-carlos-gabbys',
    title: "Carlos and Gabby's Cedarhurst",
    description: 'Kosher Mexican/meat restaurant. Public kosher restaurant listing notes Vaad Hakashrus of Five Towns & Far Rockaway supervision.',
    type: 'restaurant',
    location_text: '143 Washington Ave, Cedarhurst',
    location_lat: 40.6238,
    location_lng: -73.7285,
    verification: 'Verified kosher',
    source_url: 'https://www.totallyjewishtravel.com/Kosher_Restaurant-TE49952-carlos_and_gabbys-Reviews-cedarhurst_new_york.html',
  },
  {
    id: 'food-ondas-fuego',
    title: 'Ondas by Fuego',
    description: 'Modern Mexican kosher steakhouse. Official site shows Vaad Hakashrus kosher certification and Cedarhurst address.',
    type: 'restaurant',
    location_text: '488 Central Ave, Cedarhurst',
    location_lat: 40.6224,
    location_lng: -73.7284,
    verification: 'Verified kosher',
    source_url: 'https://ondasnyc.com/menu/',
  },
  {
    id: 'shop-cheese-store',
    title: 'The Cheese Store',
    description: 'Kosher dairy and takeout shop on Central Avenue. Public kosher ordering listing includes address and kosher positioning.',
    type: 'grocery',
    location_text: '532 Central Ave, Cedarhurst',
    location_lat: 40.6225,
    location_lng: -73.7273,
    verification: 'Kosher shop listing',
    source_url: 'https://happykosher.app/the-cheese-store',
  },
  {
    id: 'shop-carving-block',
    title: 'Carving Block',
    description: 'Kosher butcher shop in Cedarhurst. GoKosher lists fresh meat/frozen meat kosher store details.',
    type: 'grocery',
    location_text: '560A Central Ave, Cedarhurst',
    location_lat: 40.6224,
    location_lng: -73.7267,
    verification: 'Kosher shop listing',
    source_url: 'https://www.gokosher.com/en/f96481',
  },
  {
    id: 'shop-jerusalem-mini-market',
    title: 'Jerusalem Mini Market',
    description: 'Israeli specialty grocery and prepared-food market listed publicly on Central Avenue.',
    type: 'grocery',
    location_text: '698 Central Ave, Cedarhurst',
    location_lat: 40.6217,
    location_lng: -73.7224,
    verification: 'Community shop listing',
    source_url: 'https://www.mapquest.com/us/new-york/jerusalem-minimarket-413822744',
  },
  {
    id: 'shop-bobbys-blue-ribbon',
    title: "Bobby's Blue Ribbon Market",
    description: 'Fruit, produce, flowers, gift baskets, and kosher groceries with Five Towns delivery.',
    type: 'grocery',
    location_text: '125 Spruce St, Cedarhurst',
    location_lat: 40.6219,
    location_lng: -73.7276,
    verification: 'Community shop listing',
    source_url: 'https://www.bobbysblueribbon.com/',
  },
  {
    id: 'shop-gourmet-glatt-cedarhurst',
    title: 'Gourmet Glatt Cedarhurst',
    description: 'Kosher supermarket with produce, butcher, deli/prepared foods, bakery goods, sushi, and groceries.',
    type: 'grocery',
    location_text: '137 Spruce St, Cedarhurst',
    location_lat: 40.622,
    location_lng: -73.7279,
    verification: 'Kosher supermarket listing',
    source_url: 'https://gourmetglatt.com/our-stores/',
  },
  {
    id: 'shop-gourmet-glatt-woodmere',
    title: 'Gourmet Glatt Woodmere',
    description: 'Kosher supermarket with fresh produce, butcher, deli/prepared foods, bakery goods, sushi, and groceries.',
    type: 'grocery',
    location_text: '1030 Railroad Ave, Woodmere',
    location_lat: 40.6326,
    location_lng: -73.7169,
    verification: 'Kosher supermarket listing',
    source_url: 'https://gourmetglatt.com/our-stores/',
  },
  {
    id: 'shop-oppen-scrolls',
    title: 'Oppen Scrolls',
    description: 'Judaica shop and sofer services for mezuzah, tefillin, shofars, kippot, and more.',
    type: 'judaica',
    location_text: '202 Rockaway Tpke, Cedarhurst',
    location_lat: 40.6271,
    location_lng: -73.7351,
    verification: 'Judaica shop listing',
    source_url: 'https://www.mapquest.com/us/new-york/oppen-scrolls-26703297',
  },
  {
    id: 'shop-j-greenstein',
    title: 'J. Greenstein & Co.',
    description: 'Judaica gallery and auction house for antique Jewish ritual objects, Jewish art, seforim, megillot, and silver.',
    type: 'judaica',
    location_text: '524 Central Ave, Cedarhurst',
    location_lat: 40.6225,
    location_lng: -73.7275,
    verification: 'Judaica shop listing',
    source_url: 'https://jgreenstein.com/about/',
  },
  {
    id: 'service-gural-jcc',
    title: 'The Marion & Aaron Gural JCC',
    description: 'Jewish community resource offering educational, enrichment, recreational, volunteer, and social services.',
    type: 'services',
    location_text: '207 Grove Ave, Cedarhurst',
    location_lat: 40.6214,
    location_lng: -73.7257,
    verification: 'Community services directory',
    source_url: 'https://www.guraljcc.org/',
  },
  {
    id: 'service-gural-jcc-lawrence',
    title: 'Gural JCC Harrison-Kerr Family Campus',
    description: 'JCC campus in Lawrence with early childhood and family/community programming.',
    type: 'services',
    location_text: '140 Central Ave, Lawrence',
    location_lat: 40.6132,
    location_lng: -73.7355,
    verification: 'Community services directory',
    source_url: 'https://www.guraljcc.org/contact-us/',
  },
  {
    id: 'service-achiezer',
    title: 'Achiezer Community Resource Center',
    description: 'Community service organization with health insurance, mental health, eldercare, legal network, and urgent support programs.',
    type: 'wellness',
    location_text: '334 Central Ave, Lawrence',
    location_lat: 40.6164,
    location_lng: -73.731,
    verification: 'Community wellness/services directory',
    source_url: 'https://www.achiezer.org/contact',
  },
  {
    id: 'wellness-five-towns-premier',
    title: 'Five Towns Premier Rehabilitation & Nursing',
    description: 'Rehabilitation and nursing center in Woodmere with resident services and religious/community accommodations.',
    type: 'wellness',
    location_text: '1050 Central Ave, Woodmere',
    location_lat: 40.6329,
    location_lng: -73.7077,
    verification: 'Wellness services listing',
    source_url: 'https://fivetownspremier.com/',
  },
  {
    id: 'shop-judaica-plus',
    title: 'Judaica Plus',
    description: 'Judaica and Jewish book/gift shop in Cedarhurst. Public listings describe Judaica, seforim, religious goods, and holiday items.',
    type: 'judaica',
    location_text: '445 Central Ave, Cedarhurst',
    location_lat: 40.6223,
    location_lng: -73.7294,
    verification: 'Community-serving business',
    source_url: 'https://www.allbiz.com/business/judaica-plus_2b-516-295-4343',
  },
  {
    id: 'shop-z-berman-books',
    title: 'Z. Berman Books Cedarhurst',
    description: 'Jewish bookstore and Judaica/seforim shop in Cedarhurst. Public listings describe books, seforim, siddurim, and Jewish items.',
    type: 'judaica',
    location_text: '408 Central Ave, Cedarhurst',
    location_lat: 40.6219,
    location_lng: -73.7304,
    verification: 'Community-serving business',
    source_url: 'https://www.chamberofcommerce.com/business-directory/new-york/cedarhurst/book-store/2001148655-z-berman-books-cedarhurst',
  },
  {
    id: 'shop-sukkah-depot-five-towns',
    title: 'Sukkah Depot of Five Towns',
    description: 'Seasonal Jewish holiday/sukkah business listed publicly with a Five Towns/Cedarhurst location.',
    type: 'judaica',
    location_text: '445 Central Ave, Cedarhurst',
    location_lat: 40.62235,
    location_lng: -73.72945,
    verification: 'Community-serving business',
    source_url: 'https://www.sukkahdepot.com/stores/five-towns/',
  },
  {
    id: 'service-levi-yitzchak-library',
    title: 'Levi Yitzchak Library & Family Center',
    description: 'Jewish family library and community resource with traditional Jewish books, activities, and family programming.',
    type: 'services',
    location_text: '564 Central Ave, Cedarhurst',
    location_lat: 40.6223,
    location_lng: -73.7263,
    verification: 'Community resource',
    source_url: 'https://www.lylibrary.org/',
  },
  {
    id: 'lost-siddur',
    title: 'Lost siddur reported',
    description: 'Black siddur found near Central Ave. Claim with details.',
    type: 'lost_found',
    location_text: 'Cedarhurst',
    location_lat: 40.6214,
    location_lng: -73.7253,
  },
  {
    id: 'event-learning',
    title: 'Community learning night',
    description: 'Setup help and shiur event tonight.',
    type: 'event',
    location_text: 'Lawrence',
    location_lat: 40.6168,
    location_lng: -73.7308,
  },
  {
    id: 'event-shabbos',
    title: 'Shabbos hosting meetup',
    description: 'Host and guest matching event.',
    type: 'event',
    location_text: 'Five Towns',
    location_lat: 40.6361,
    location_lng: -73.7162,
  },
];

function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 13);
    }
  }, [center, map]);

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    const timers = [0, 120, 350, 800].map((delay) => window.setTimeout(invalidate, delay));
    window.addEventListener('resize', invalidate);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
}

function getDistanceMiles(from, to) {
  if (!from || !to?.location_lat || !to?.location_lng) return null;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(to.location_lat - from.lat);
  const dLng = toRadians(to.location_lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.location_lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distance) {
  if (distance === null || !Number.isFinite(distance)) return null;
  if (distance < 0.1) return 'Less than 0.1 mi away';
  if (distance < 10) return `${distance.toFixed(1)} mi away`;
  return `${Math.round(distance)} mi away`;
}

function getMapLinks(point, userLocation) {
  if (!point) return null;
  const lat = point.location_lat;
  const lng = point.location_lng;
  if (!lat || !lng) return null;
  const label = encodeURIComponent(point.title || point.location_text || 'JUnited map pin');
  const hasStreetAddress = /^\d/.test(point.location_text || '');
  const destinationText = hasStreetAddress
    ? `${point.location_text}, NY`
    : `${lat},${lng}`;
  const destination = encodeURIComponent(destinationText);
  const query = encodeURIComponent(`${point.title || point.location_text || 'JUnited map pin'} ${point.location_text || ''}`.trim());
  const origin = userLocation?.lat && userLocation?.lng
    ? `&origin=${userLocation.lat},${userLocation.lng}`
    : '';
  const appleStart = userLocation?.lat && userLocation?.lng
    ? `saddr=${userLocation.lat},${userLocation.lng}&`
    : '';

  return {
    google: `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`,
    apple: `https://maps.apple.com/?${appleStart}daddr=${destination}&q=${label}&dirflg=d`,
    waze: hasStreetAddress
      ? `https://waze.com/ul?q=${destination}&navigate=yes`
      : `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${query}`,
  };
}

export default function MitzvahMap({ requests, userLocation, onSelectRequest, communityPoints = [], personalized = true, mapHeight, includeStaticPoints = false }) {
  const [mapCenter, setMapCenter] = useState(null);
  const [activeTypes, setActiveTypes] = useState(() => new Set());
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tileUrl, setTileUrl] = useState('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
  const resolvedMapHeight = mapHeight || 'clamp(460px, 64dvh, 720px)';

  const requestPoints = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      type: getRequestPinType(request),
      description: request.description,
      location_text: request.location_text || request.neighborhood || request.locationLabel || 'Five Towns',
      isRequest: true,
    }));
  }, [requests]);

  const personalizedPoints = useMemo(() => {
    return communityPoints.map((point) => ({
      ...point,
      type: point.type || 'community_post',
      isCommunityPoint: true,
    }));
  }, [communityPoints]);
  const allPoints = useMemo(
    () => [...requestPoints, ...personalizedPoints, ...(includeStaticPoints ? STATIC_POINTS : [])],
    [includeStaticPoints, personalizedPoints, requestPoints]
  );
  const visiblePoints = useMemo(() => allPoints.filter((point) => activeTypes.has(point.type)), [activeTypes, allPoints]);
  const spreadVisiblePoints = useMemo(() => {
    const buckets = new Map();

    visiblePoints.forEach((point) => {
      if (!point.location_lat || !point.location_lng) return;
      const bucketKey = [
        Math.round(point.location_lat * CLUSTER_BUCKET_SCALE),
        Math.round(point.location_lng * CLUSTER_BUCKET_SCALE),
      ].join(':');
      const bucket = buckets.get(bucketKey) || [];
      bucket.push(point);
      buckets.set(bucketKey, bucket);
    });

    return visiblePoints.map((point) => {
      if (!point.location_lat || !point.location_lng) return point;

      const bucketKey = [
        Math.round(point.location_lat * CLUSTER_BUCKET_SCALE),
        Math.round(point.location_lng * CLUSTER_BUCKET_SCALE),
      ].join(':');
      const bucket = buckets.get(bucketKey) || [];
      if (bucket.length <= 1) {
        return {
          ...point,
          display_lat: point.location_lat,
          display_lng: point.location_lng,
        };
      }

      const index = bucket.findIndex((candidate) => candidate.id === point.id);
      const angle = (Math.PI * 2 * index) / bucket.length;
      const ring = Math.floor(index / 8);
      const radius = CLUSTER_BASE_RADIUS + ring * 0.00018;

      return {
        ...point,
        display_lat: point.location_lat + Math.sin(angle) * radius,
        display_lng: point.location_lng + Math.cos(angle) * radius,
      };
    });
  }, [visiblePoints]);
  const hasActiveFilters = activeTypes.size > 0;
  const activePrimaryFilter = PRIMARY_FILTERS.find((filter) => (
    filter.types.length === activeTypes.size && filter.types.every((type) => activeTypes.has(type))
  ))?.key;
  const selectedMapLinks = getMapLinks(selectedPoint, userLocation);
  const selectedDistance = formatDistance(getDistanceMiles(userLocation, selectedPoint));

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (allPoints.length > 0 && allPoints[0].location_lat) {
      setMapCenter([allPoints[0].location_lat, allPoints[0].location_lng]);
    } else {
      setMapCenter([40.6249, -73.7178]);
    }
  }, [userLocation, allPoints]);

  useEffect(() => {
    if (!selectedPoint) return;
    const pointStillVisible = visiblePoints.some((point) => point.id === selectedPoint.id);
    if (!pointStillVisible) setSelectedPoint(null);
  }, [selectedPoint, visiblePoints]);

  const toggleType = (type) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const applyPrimaryFilter = (filter) => {
    if (activePrimaryFilter === filter.key) {
      setActiveTypes(new Set());
      setSelectedPoint(null);
      return;
    }
    setActiveTypes(new Set(filter.types));
    setSelectedPoint(null);
  };

  const createMarkerIcon = (type) => {
    const config = PIN_TYPES[type] || PIN_TYPES.other;
    return divIcon({
      className: `custom-marker custom-marker-${type}`,
      html: `<div style="
        background-color: ${config.color};
        width: 34px;
        height: 34px;
        border-radius: 14px 14px 14px 4px;
        transform: rotate(-45deg) translateY(-2px);
        border: 3px solid white;
        box-shadow: 0 8px 18px rgba(15,23,42,0.28);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 13px;
          font-weight: 900;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin-top: -2px;
        ">${config.short}</div>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });
  };

  if (!mapCenter) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-slate-100" style={{ height: resolvedMapHeight }}>
        <p className="text-slate-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
      {/* Five Towns hub banner */}
      {personalized && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-[12px] font-black text-blue-900">Five Towns digital hub</p>
          <p className="text-[11px] font-semibold leading-5 text-blue-700">
            A personalized local map for Lawrence, Cedarhurst, Woodmere, Hewlett, and Inwood, showing verified kosher food, shops, shuls, schools, posts, events, and mitzvah needs from communities you joined.
          </p>
        </div>
      )}

      {/* Primary filter chips — horizontal scroll, matches Communities chip pattern */}
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white px-2 py-2">
        {PRIMARY_FILTERS.map((filter) => {
          const active = activePrimaryFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => applyPrimaryFilter(filter)}
              className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
                active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Type filter chips */}
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white px-2 py-2">
        {Object.entries(PIN_TYPES).filter(([type]) => type !== 'other').map(([type, config]) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`motion-press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : config.color }}
              />
              {config.label}
            </button>
          );
        })}
        {hasActiveFilters && (
          <button
            onClick={() => setActiveTypes(new Set())}
            className="motion-press flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-100"
          >
            Clear
          </button>
        )}
      </div>

      {/* Map canvas */}
      <div className="relative">
        {!hasActiveFilters && (
          <div className="glass-toolbar absolute left-3 right-3 top-3 z-[500] rounded-2xl px-4 py-3">
            <p className="text-[13px] font-black text-slate-900">Pick a filter to show pins</p>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
              Choose verified kosher food, shops, shuls, schools, community businesses, lost and found, help, mitzvahs, events, or community posts.
            </p>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={13}
          minZoom={9}
          style={{ height: resolvedMapHeight, minHeight: 460, width: '100%' }}
          className="junited-leaflet-map"
          zoomControl={true}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          scrollWheelZoom={true}
          worldCopyJump={true}
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrl}
            eventHandlers={{
              tileerror: () => {
                if (tileUrl.includes('cartocdn')) {
                  setTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
                }
              },
            }}
          />

          {userLocation && hasActiveFilters && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={divIcon({
                className: 'user-marker',
                html: `<div style="
                  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            />
          )}

          {spreadVisiblePoints.map(point => {
            if (!point.location_lat || !point.location_lng) return null;

            return (
              <Marker
                key={point.id}
                position={[point.display_lat || point.location_lat, point.display_lng || point.location_lng]}
                icon={createMarkerIcon(point.type)}
                eventHandlers={{
                  click: () => {
                    setSelectedPoint(point);
                    if (point.isRequest) onSelectRequest?.(point);
                  }
                }}
              />
            );
          })}
        </MapContainer>

        {/* Selected point card */}
        {selectedPoint && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[550]">
            <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/96 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black text-white"
                    style={{ backgroundColor: (PIN_TYPES[selectedPoint.type] || PIN_TYPES.other).color }}
                  >
                    {(PIN_TYPES[selectedPoint.type] || PIN_TYPES.other).label}
                  </div>
                  <p className="truncate text-[14px] font-black text-slate-950">{selectedPoint.title}</p>
                  <p className="mt-1 line-clamp-3 text-[12px] font-semibold leading-5 text-slate-600">
                    {selectedPoint.description || 'Tap the marker to view details for this map item.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoint(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[16px] font-black text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close map summary"
                >
                  ×
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                {selectedPoint.location_text && (
                  <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                    {selectedPoint.location_text}
                  </span>
                )}
                {selectedDistance && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
                    {selectedDistance}
                  </span>
                )}
                {selectedPoint.verification && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-100">
                    {selectedPoint.verification}
                  </span>
                )}
                {selectedPoint.communityName && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
                    {selectedPoint.communityName}
                  </span>
                )}
                {selectedPoint.posterName && (
                  <span className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                    {selectedPoint.posterName}
                  </span>
                )}
              </div>
              {selectedMapLinks && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <a
                    href={selectedMapLinks.google}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press rounded-xl bg-blue-600 px-2 py-2 text-center text-[11px] font-black text-white shadow-sm"
                  >
                    Google Maps
                  </a>
                  <a
                    href={selectedMapLinks.apple}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-[11px] font-black text-slate-700"
                  >
                    Apple Maps
                  </a>
                  <a
                    href={selectedMapLinks.waze}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-center text-[11px] font-black text-cyan-700"
                  >
                    Waze
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview cards strip */}
      {hasActiveFilters && visiblePoints.length > 0 && (
        <div className="border-t border-slate-200 bg-white px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-wide text-slate-500">Visible pins</p>
              <p className="text-[12px] font-semibold text-slate-600">
                Tap any item here to preview it, even when map pins overlap.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
              {visiblePoints.length}
            </span>
          </div>

          <div className="mobile-scroll-x flex gap-2 pb-1">
            {visiblePoints.map((point) => {
              const config = PIN_TYPES[point.type] || PIN_TYPES.other;
              const active = selectedPoint?.id === point.id;
              const distanceLabel = formatDistance(getDistanceMiles(userLocation, point));
              return (
                <button
                  key={`preview-${point.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedPoint(point);
                    if (point.isRequest) onSelectRequest?.(point);
                  }}
                  className={`min-w-[220px] shrink-0 rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.label}
                    </span>
                    {point.verification && (
                      <span className="truncate text-[10px] font-black text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[13px] font-black text-slate-950">{point.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-600">
                    {point.description || 'Tap to preview this map item.'}
                  </p>
                  {point.location_text && (
                    <p className="mt-2 truncate text-[11px] font-black text-slate-400">{point.location_text}</p>
                  )}
                  {distanceLabel && (
                    <p className="mt-1 truncate text-[11px] font-black text-blue-600">{distanceLabel}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getRequestPinType(request) {
  const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
  if (/lost|found|missing|returned/.test(text)) return 'lost_found';
  if (/event|simcha|shiur|learning night|melave|setup/.test(text)) return 'event';
  if (request.status === 'Open' || request.status === 'Offered') {
    if (request.type === 'volunteer') return 'mitzvah_available';
    return 'help_needed';
  }
  return 'help_needed';
}

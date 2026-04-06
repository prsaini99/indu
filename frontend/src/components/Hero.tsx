
import HeroBanner from './hero/HeroBanner';
import SearchSection from './hero/SearchSection';
import FeatureHighlights from './hero/FeatureHighlights';
import PopularCategories from './hero/PopularCategories';

const Hero = () => {
  return (
    <>
      <HeroBanner />
      <FeatureHighlights />
      <PopularCategories />
      <SearchSection />
    </>
  );
};

export default Hero;

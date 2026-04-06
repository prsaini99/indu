
const TrustBanner = () => {
  return (
    <div className="py-6 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-talent-dark font-medium">Trusted by 1M+ families worldwide</p>
            <p className="text-talent-muted text-sm">Join thousands of parents who choose our expert tutors</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <img src="https://via.placeholder.com/100x30?text=Partner1" alt="Partner 1" className="h-8 opacity-60" />
            <img src="https://via.placeholder.com/100x30?text=Partner2" alt="Partner 2" className="h-8 opacity-60" />
            <img src="https://via.placeholder.com/100x30?text=Partner3" alt="Partner 3" className="h-8 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBanner;

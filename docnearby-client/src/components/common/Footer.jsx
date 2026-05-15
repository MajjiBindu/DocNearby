export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-12">
      <div className="section-container">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">D</div>
              <span className="font-extrabold text-secondary text-xl tracking-tight">DocNearby</span>
            </div>
            <p className="text-medical-text-light text-sm max-w-sm leading-relaxed">
              DocNearby is a dedicated healthcare platform built to empower independent doctors and local clinics across Tier 2 and Tier 3 India. We believe in direct, transparent access to medical professionals.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-secondary text-sm uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm font-semibold text-medical-text-light">
              <li className="hover:text-primary cursor-pointer transition-colors">Search Doctors</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Nearby Labs</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Book Clinics</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Patient Portal</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-secondary text-sm uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-semibold text-medical-text-light">
              <li className="hover:text-primary cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Contact Us</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-medical-text-light/60">
            © {new Date().getFullYear()} DocNearby Healthcare Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-medical-text-light/60 hover:text-primary cursor-pointer">Facebook</span>
            <span className="text-xs font-bold text-medical-text-light/60 hover:text-primary cursor-pointer">Twitter</span>
            <span className="text-xs font-bold text-medical-text-light/60 hover:text-primary cursor-pointer">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


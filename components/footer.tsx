export default function Footer() {
  return (
    <footer className="w-full bg-[#020813] text-platinum border-t border-gold-metallic/10 py-16 px-4 sm:px-6 lg:px-8 relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
        
        {/* Primary Identity Segment Column */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <span className="text-xl font-black tracking-widest text-gold-metallic mb-4 block">
              TT LAUNDRY
            </span>
            <p className="text-sm text-platinum/60 max-w-xs leading-relaxed mb-6">
              Engineering pristine, algorithmic fabric preservation and premium garment care frameworks daily.
            </p>
          </div>
          <span className="text-xs text-platinum/40 block">
            © 2026 TT Laundry Care Systems. All Rights Reserved.
          </span>
        </div>

        {/* Navigation Core Track Links Column */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <span className="text-xs font-bold tracking-widest text-gold-pastel uppercase mb-2">Quick Links</span>
          <a href="#home" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Home</a>
          <a href="#how-it-works" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">How Valet Works</a>
          <a href="#services" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Workflow Library</a>
          <a href="#coverage" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Coverage Index</a>
        </div>

        {/* Expansion Nodes Status Links Column */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <span className="text-xs font-bold tracking-widest text-gold-pastel uppercase mb-2">Expansion Regions</span>
          <span className="text-sm text-platinum/60 flex items-center gap-2">Ibadan Central <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /></span>
          <span className="text-sm text-platinum/60 flex items-center gap-2">Bodija Node <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /></span>
          <span className="text-sm text-platinum/60 flex items-center gap-2">Jericho Hub <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /></span>
          <span className="text-sm text-platinum/40 italic">Lagos Network Node (Queued)</span>
        </div>

        {/* Structural Corporate Governance Legal Column */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <span className="text-xs font-bold tracking-widest text-gold-pastel uppercase mb-2">Legal Archive</span>
          <a href="#terms" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Terms of Care Asset Custody</a>
          <a href="#liability" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Fabric Liability Matrix</a>
          <a href="#privacy" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Privacy Matrix Data Mapping</a>
          <a href="#sla" className="text-sm text-platinum/60 hover:text-gold-metallic transition-colors">Operational Deployment SLA</a>
        </div>
      </div>
    </footer>
  );
}
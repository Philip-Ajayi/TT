export default function Footer() {
  return (
    <footer className="bg-[#020813] border-t border-gold/10 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-gold text-xl font-bold mb-4">TT Laundry</h3>
          <p className="text-sm">
            Crafting pristine fabric ecosystems daily. Premium care for your wardrobe.
          </p>
          <p className="text-xs mt-4 text-gray-500">© 2026 TT Laundry Care.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#home" className="hover:text-gold transition">Home</a></li>
            <li><a href="#how-it-works" className="hover:text-gold transition">How Valet Works</a></li>
            <li><a href="#services" className="hover:text-gold transition">Workflow Library</a></li>
            <li><a href="#coverage" className="hover:text-gold transition">Coverage Index</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Expansion Regions</h4>
          <ul className="space-y-2 text-sm">
            <li>Ibadan Central</li>
            <li>Bodija Node</li>
            <li>Jericho Hub</li>
            <li>Lagos (Coming)</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Legal Archive</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-gold transition">Terms of Care</a></li>
            <li><a href="#" className="hover:text-gold transition">Fabric Liability</a></li>
            <li><a href="#" className="hover:text-gold transition">Privacy Matrix</a></li>
            <li><a href="#" className="hover:text-gold transition">Operational SLA</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
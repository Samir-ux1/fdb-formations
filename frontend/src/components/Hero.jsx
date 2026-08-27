import React from 'react';
import { ArrowRight, KeyRound, ShieldCheck, Award, Users } from 'lucide-react';

export const Hero = ({ onExplore, onOpenKeyModal }) => {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white py-16 md:py-24 rounded-3xl mb-12 shadow-xl border border-slate-800">
      {/* Fond graphique texturé */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB0A1E]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-[#EB0A1E] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Plateforme Officielle FDB Formations</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          Excellence Professionnelle & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-300">
            Formations Certifiantes
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-normal leading-relaxed">
          Accédez à nos parcours certifiants, validez vos acquis grâce aux quiz interactifs et réussissez votre examen final pour obtenir votre attestation officielle.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#EB0A1E] hover:bg-[#BD0014] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>Explorer le Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenKeyModal}
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#EB0A1E]" />
            <span>Débloquer avec une clé</span>
          </button>
        </div>

        {/* Statistiques clés */}
        <div className="grid grid-cols-3 gap-4 pt-10 border-t border-slate-800/80 max-w-2xl mx-auto">
          <div>
            <div className="text-2xl md:text-3xl font-black text-white">98.4%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taux de Réussite</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-[#EB0A1E]">100%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conformité</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-white">2 400+</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Certifiés FDB</div>
          </div>
        </div>
      </div>
    </section>
  );
};
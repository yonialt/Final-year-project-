import React from 'react';
import { Brain, AlertTriangle, CheckCircle, Info, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';

const AiPanel = ({ decisionData }) => {
  if (!decisionData) {
    return (
      <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 300 }}>
        <Brain size={48} className="text-dim" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
        <p className="text-muted">Select a maintenance task to initiate<br/>AI diagnostic analysis.</p>
      </div>
    );
  }

  const isReplace = decisionData.aiDecision === 'REPLACE';
  const confidence = Math.round(decisionData.aiConfidence * 100);

  return (
    <div className="glass-card animate-in" style={{ borderLeft: `4px solid ${isReplace ? 'var(--accent-rose)' : 'var(--accent-emerald)'}` }}>
      <div className="flex items-center justify-between mb-xl">
        <div className="flex items-center gap-sm">
          <div className="pulse" style={{ color: 'var(--accent-blue)' }}>
            <Brain size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Neural Diagnostic</h2>
        </div>
        <div className="badge-ai">
          <Zap size={12} />
          Live Analysis
        </div>
      </div>

      {!decisionData.aiDecision ? (
        <div className="flex-col items-center gap-md py-xl">
          <div className="pulse">
            <Activity size={40} className="text-accent" />
          </div>
          <p className="text-center text-muted">Awaiting technical parameters<br/>to compute recommendation...</p>
        </div>
      ) : (
        <>
          <div 
            style={{ 
              background: isReplace ? 'rgba(251, 113, 133, 0.05)' : 'rgba(52, 211, 153, 0.05)',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              marginBottom: '2rem',
              border: `1px solid ${isReplace ? 'rgba(251, 113, 133, 0.1)' : 'rgba(52, 211, 153, 0.1)'}`
            }}
          >
            <p className="text-dim" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Final Recommendation</p>
            <h1 style={{ color: isReplace ? 'var(--accent-rose)' : 'var(--accent-emerald)', margin: 0, fontSize: '3rem', fontWeight: 900 }}>
              {decisionData.aiDecision}
            </h1>
            <div className="flex items-center justify-center gap-xs mt-sm" style={{ color: 'var(--text-muted)' }}>
              <TrendingUp size={14} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{confidence}% Confidence Score</span>
            </div>
          </div>

          <div className="flex-col gap-lg">
            <div className="flex-col gap-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-xs text-muted" style={{ fontSize: '0.85rem' }}>
                  <DollarSign size={14} />
                  <span>Cost Efficiency Ratio</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{((decisionData.repairCost / decisionData.newPrice) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(decisionData.repairCost / decisionData.newPrice) * 100}%`, height: '100%', background: 'var(--accent-blue)' }}></div>
              </div>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="p-md" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-xs text-dim mb-xs" style={{ fontSize: '0.75rem' }}>
                  <Clock size={12} />
                  <span>Asset Age</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{decisionData.age} <span style={{ fontSize: '0.8rem', fontWeight: 500 }} className="text-muted">Years</span></div>
              </div>
              <div className="p-md" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-xs text-dim mb-xs" style={{ fontSize: '0.75rem' }}>
                  <AlertTriangle size={12} />
                  <span>Damage Criticality</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{decisionData.damageLevel}<span className="text-dim">/3</span></div>
              </div>
            </div>
          </div>

          <div className="mt-xl p-lg" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
            <div className="flex gap-md items-start">
              <div style={{ marginTop: 2, color: 'var(--accent-blue)' }}>
                <Info size={18} />
              </div>
              <p className="text-muted" style={{ lineHeight: 1.5 }}>
                {isReplace 
                  ? "High repair-to-value ratio or severe damage detected. Procurement of a new unit is significantly more cost-effective over the next 24 months." 
                  : "Resource integrity remains high. Estimated repair costs are within optimal threshold. Expected extension of service life: 18-24 months."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AiPanel;

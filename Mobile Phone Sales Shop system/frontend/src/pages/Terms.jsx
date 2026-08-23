import React from 'react';
import { ShieldAlert, BookOpen } from 'lucide-react';

export default function Terms() {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px', maxWidth: '800px' }}>
      
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={28} className="text-primary" /> Terms & Conditions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '30px' }}>
          Last Updated: August 23, 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)' }}>
          
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '10px' }}>1. Agreement to Terms</h2>
            <p>
              By accessing and placing an order with Antigravity Phones, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and Antigravity Phones.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '10px' }}>2. Product Configuration & Availability</h2>
            <p>
              All mobile devices, variants (RAM/ROM configurations), and repair diagnostics are subject to availability. We reserve the right to modify prices, discount schedules, or discontinue products without prior notification.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '10px' }}>3. Warranty & Repairs</h2>
            <p>
              All brand new products sold carry their respective manufacturer's warranty. Diagnostics and repair jobs logged under our Repair & Diagnostics Center carry a standard 30-day warranty on parts replaced, unless otherwise noted in the specific repair invoice notes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '10px' }}>4. Loyalty Points Policy</h2>
            <p>
              Loyalty points are awarded at a rate of 1 point per Rs. 1,000 spent on successful orders. Points can be redeemed during checkout at a rate of 1 point = Rs. 1 discount. Points are non-transferable and hold no physical cash value.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '10px' }}>5. Account Suspension</h2>
            <p>
              We reserve the right to lock or permanently disable any customer account that is flagged for fraudulent activity, payment failures, or policy violation, as managed by our administrator staff directory toggles.
            </p>
          </section>

        </div>

      </div>

    </div>
  );
}

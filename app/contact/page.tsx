'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { createLead } from '@/lib/data';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // Save to leads collection
      await createLead(formData.email, 'contact');
      
      // In a real app, you'd also send an email here
      console.log('Contact form submission:', formData);
      
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-display mb-8 text-center">Contact Us</h1>
        
        <p className="text-lg text-muted mb-12 text-center">
          Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wider hover:bg-muted transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <p className="text-center text-sm font-medium">✓ Message sent successfully!</p>
          )}

          {status === 'error' && (
            <p className="text-center text-sm font-medium">✕ Something went wrong. Please try again.</p>
          )}
        </form>

        <div className="mt-16 pt-16 border-t border-border">
          <h2 className="text-2xl font-display mb-6 text-center">Other Ways to Reach Us</h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-center">
            <div>
              <h3 className="font-medium mb-2">Email</h3>
              <a href="mailto:info@binmukhtarretail.com" className="text-muted hover:text-bmr-black">
                info@binmukhtarretail.com
              </a>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Phone</h3>
              <a href="tel:+1234567890" className="text-muted hover:text-bmr-black">
                +1 (234) 567-890
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

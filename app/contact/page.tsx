'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Show warning if email not configured
      if (data.warning) {
        setErrorMessage(data.warning);
      }
      
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error: any) {
      console.error('Contact form error:', error);
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
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
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night focus:border-transparent"
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
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night focus:border-transparent"
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
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night focus:border-transparent"
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
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full px-8 py-4 bg-bmr-night text-surface-2 text-sm uppercase tracking-wider rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'sending' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>

          {status === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Message received!</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {errorMessage || "We'll get back to you within 24-48 hours."}
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage || 'Something went wrong. Please try again.'}</p>
            </div>
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
              <a href="tel:+17347852726" className="text-muted hover:text-bmr-black">
                +1 (734) 785-2726
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

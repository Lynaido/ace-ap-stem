import React from 'react';
import './Testimonials.css';

const testimonialData = [
  {
    id: 1,
    title: 'Highly recommended',
    text: (
      <>
        "Taking notes and actually <span className="highlight">helps so much</span>... the professor is saying... makes it so much easier to study."
      </>
    ),
    author: 'App Store User'
  },
  {
    id: 2,
    title: 'Impressed',
    text: (
      <>
        "My teacher talks way too fast... I was very skeptical because my teacher gets sidetracked and students discuss a variety of things in class. However this AI understood what was side conversation and what was important. Took some of the <span className="highlight">most organized notes I have ever seen</span>!"
      </>
    ),
    author: 'twilightsparkle'
  },
  {
    id: 3,
    title: 'Game changer',
    text: (
      <>
        "I myself am not good at taking notes because I lack the ability to focus... <span className="highlight">This app can handle that problem</span> and make the note taking process easier, so I can understand the core concepts."
      </>
    ),
    author: 'App Store User'
  },
  {
    id: 4,
    title: 'Literally a life saver',
    text: (
      <>
        "I have Maladaptive Daydreaming & ADHD and cannot focus on class at times... Finding out I can <span className="highlight">record lectures and look back on them later has saved me</span>! It's super organized. 10/10!"
      </>
    ),
    author: 'Justycel'
  },
  {
    id: 5,
    title: 'No words',
    text: (
      <>
        "It really <span className="highlight">helps you do more</span>... it makes it more easy to study with chatbot, flashcards, quizzes... studying."
      </>
    ),
    author: 'Nifili lii'
  }
];

// Duplicate the array multiple times to ensure the marquee has enough track length to loop seamlessly
const marqueeData = [...testimonialData, ...testimonialData, ...testimonialData, ...testimonialData];

const Testimonials = () => {
  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <h2>See what our users say</h2>
          <p className="testimonials-subtitle">
            4.8★ on the Play Store &middot; 4.8★ on the App Store &middot; 300k+ reviews
          </p>
        </div>

        <div className="testimonials-carousel">
          <div className="testimonials-track">
            {marqueeData.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="testimonial-card">
                <h3 className="testimonial-card-title">{item.title}</h3>
                <p className="testimonial-text">{item.text}</p>
                <div className="testimonial-author">&mdash; {item.author}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

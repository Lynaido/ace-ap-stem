import React from 'react';
import './AboutUsPage.css';

const AboutUsPage = () => {
  return (
    <div className="about-us-page">
      <div className="container">
        {/* Header Section */}
        <section className="about-header">
          <h1 className="page-title">About Us</h1>
          <p className="page-subtitle">
            Empowering students to excel in AP STEM courses through innovative learning solutions
          </p>
        </section>

        {/* Main Content */}
        <div className="about-content">
          {/* Founder Section */}
          <section className="founder-section">
            <div className="founder-content">
              <div className="founder-text">
                <h2 className="section-title">Meet the Founder</h2>
                <h3 className="founder-name">Linh Ai Do – Lyna</h3>

                <div className="founder-story">
                  <div className="story-section">
                    <h4 className="story-title">Inspiration</h4>
                    <p className="story-text">
                      The foundation of AAS, Ace AP STEM, is sparked from my passion for STEM and my personal experience with AP STEM courses. As a high school student myself, I understand the challenges that come with mastering these rigorous subjects. I vividly recall the difficulty of grasping complex concepts. Attending lectures alone was often insufficient, and additional practice at home became frustrating, especially when I encountered roadblocks and was unsure of how to proceed. However, what frustrated me the most was the tendency to quickly search for answers without truly understanding the material. While finding a quick solution can be tempting, I recognized that it would not lead to long-term mastery. I realized that I needed to find a way to engage more deeply with the content and develop my problem-solving skills, rather than simply finding the answer.
                    </p>
                  </div>

                  <div className="story-section">
                    <h4 className="story-title">Critical Thinking with AI</h4>
                    <p className="story-text">
                      My personal experience eventually led to the creation of AAS – a platform designed to foster independent learning while promoting critical thinking. One of the most common concerns regarding artificial intelligence is its potential to diminish human critical thinking by providing instant answers. To address this, AAS takes a unique approach. Instead of offering direct solutions to problems, the platform includes several features that guide students through the learning process. One of the most notable features is the "Generate Concept Note," which provides relevant foundational knowledge and hints when students upload a problem. This helps them work through challenges independently, allowing them to build critical thinking and problem-solving skills. By offering this kind of support, AAS encourages deeper engagement with the material, helping students develop the skills necessary for academic success.
                    </p>
                  </div>

                  <div className="story-section">
                    <h4 className="story-title">LYNAE - Heart & Hardware</h4>
                    <p className="story-text">
                      In addition to my work on AAS, I am also the founder of LYNAE, a nonprofit organization dedicated to using STEM to support mental health initiatives for children. LYNAE combines technology with compassion, designing 3D-printed therapeutic toys such as stress-relieving clickers. Each Kindness Kit is accompanied by a personalized motivational card to uplift children, particularly those in underserved communities and those facing mental health issues. Feel free to explore more about LYNAE and please consider supporting us to bring support to those who need it most. Your involvement can make a huge difference in the lives of children facing mental health issues!
                    </p>
                    <div className="lynae-links">
                      <a href="https://lynae.org/" target="_blank" rel="noopener noreferrer" className="external-link">
                        Website: https://lynae.org/
                      </a>
                      <a href="https://instagram.com/lynae_heartware" target="_blank" rel="noopener noreferrer" className="external-link">
                        Instagram: @lynae_heartware
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="founder-image">
                <img
                  src="/About Us Image.JPG"
                  alt="Linh Ai Do - Lyna, Founder of AAS and LYNAE"
                  className="founder-photo"
                />
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="mission-section">
            <div className="mission-card">
              <h3 className="mission-title">Our Mission</h3>
              <p className="mission-text">
                At AAS, we believe in empowering students to become independent learners and critical thinkers.
                Our platform bridges the gap between traditional learning methods and modern technology,
                providing the support students need to excel in their AP STEM courses while developing
                essential problem-solving skills for lifelong success.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;

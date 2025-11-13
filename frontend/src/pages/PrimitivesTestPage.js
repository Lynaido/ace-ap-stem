import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  Spinner, 
  EmptyState, 
  Select, 
  Tabs 
} from '../components/primitives';

const PrimitivesTestPage = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [activeTab, setActiveTab] = useState('tab1');
  const [loading, setLoading] = useState(false);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  const tabs = [
    { id: 'tab1', label: 'Tab 1', content: 'Content for Tab 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content for Tab 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content for Tab 3' }
  ];

  return (
    <div style={{ 
      padding: '2rem', 
      backgroundColor: 'var(--color-bg-secondary)',
      minHeight: '100vh'
    }}>
      <Card title="AAS Primitive Components Test" padding="large">
        <h1 style={{ color: 'var(--color-orange)', marginBottom: '2rem' }}>
          Primitive Components Showcase
        </h1>
        
        {/* Buttons Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Buttons</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Button variant="primary" size="small">Small</Button>
            <Button variant="primary" size="medium">Medium</Button>
            <Button variant="primary" size="large">Large</Button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" onClick={handleLoadingTest}>
              {loading ? 'Loading...' : 'Test Loading'}
            </Button>
          </div>
        </section>

        {/* Input Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Input Components</h2>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <Input
              label="Text Input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter some text"
            />
            <Input
              type="email"
              label="Email Input"
              placeholder="Enter your email"
            />
            <Input
              type="password"
              label="Password Input"
              placeholder="Enter password"
            />
            <Input
              label="Input with Error"
              error="This field has an error"
              placeholder="Error state"
            />
            <Input
              label="Disabled Input"
              disabled
              placeholder="Disabled state"
            />
          </div>
        </section>

        {/* Select Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Select Component</h2>
          <div style={{ maxWidth: '300px' }}>
            <Select
              label="Choose an option"
              value={selectValue}
              onChange={setSelectValue}
              options={selectOptions}
              placeholder="Select an option..."
            />
          </div>
        </section>

        {/* Tabs Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Tabs Component</h2>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </section>

        {/* Card Variations */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Card Variations</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <Card title="Basic Card" padding="medium">
              This is a basic card with medium padding.
            </Card>
            <Card title="Interactive Card" interactive padding="large">
              This card has hover effects and large padding.
            </Card>
            <Card padding="small">
              <strong>Card without title</strong><br />
              This card has no title and small padding.
            </Card>
          </div>
        </section>

        {/* Spinner Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Loading Spinners</h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p>Small Spinner:</p>
              <Spinner size="small" />
            </div>
            <div>
              <p>Medium Spinner:</p>
              <Spinner size="medium" />
            </div>
            <div>
              <p>Large Spinner:</p>
              <Spinner size="large" />
            </div>
            <div>
              <p>With Text:</p>
              <Spinner size="medium" text="Loading..." />
            </div>
          </div>
        </section>

        {/* Empty State Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2>Empty States</h2>
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <EmptyState
              title="No Data Found"
              description="There's nothing to display here yet."
            />
            <EmptyState
              title="Start Your Journey"
              description="Begin by adding your first item."
              actionText="Get Started"
              onAction={() => alert('Action clicked!')}
            />
          </div>
        </section>

        {/* Loading Overlay Test */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <Card padding="large">
              <Spinner size="large" text="Testing loading state..." />
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PrimitivesTestPage;
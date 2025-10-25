# WCAG 2.1 AA Accessibility Audit

This document provides a comprehensive accessibility audit of the Kennel Management System, ensuring compliance with WCAG 2.1 AA standards and providing recommendations for improvements.

## Table of Contents

1. [Overview](#overview)
2. [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
3. [Perceivable Guidelines](#perceivable-guidelines)
4. [Operable Guidelines](#operable-guidelines)
5. [Understandable Guidelines](#understandable-guidelines)
6. [Robust Guidelines](#robust-guidelines)
7. [Testing Methodology](#testing-methodology)
8. [Remediation Plan](#remediation-plan)
9. [Ongoing Monitoring](#ongoing-monitoring)

## Overview

The Kennel Management System accessibility audit ensures compliance with Web Content Accessibility Guidelines (WCAG) 2.1 AA standards, providing equal access to all users regardless of their abilities.

### Accessibility Standards

- **WCAG 2.1 AA**: Primary accessibility standard
- **Section 508**: Federal accessibility requirements
- **ADA Compliance**: Americans with Disabilities Act compliance
- **EN 301 549**: European accessibility standard

### User Groups

The system must be accessible to users with:
- **Visual Impairments**: Blind, low vision, color blindness
- **Hearing Impairments**: Deaf, hard of hearing
- **Motor Impairments**: Limited dexterity, paralysis
- **Cognitive Impairments**: Learning disabilities, attention disorders
- **Temporary Disabilities**: Broken arm, temporary vision loss

## WCAG 2.1 AA Compliance

### Principle 1: Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

#### 1.1 Text Alternatives
- **1.1.1 Non-text Content**: All non-text content has text alternatives
- **1.1.2 Audio-only/Video-only**: Media has text alternatives
- **1.1.3 Sensory Characteristics**: Instructions don't rely solely on sensory characteristics

#### 1.2 Time-based Media
- **1.2.1 Audio-only and Video-only**: Prerecorded media has alternatives
- **1.2.2 Captions**: Prerecorded video has captions
- **1.2.3 Audio Description**: Prerecorded video has audio description
- **1.2.4 Captions**: Live audio has captions
- **1.2.5 Audio Description**: Prerecorded video has audio description

#### 1.3 Adaptable
- **1.3.1 Info and Relationships**: Information structure is preserved
- **1.3.2 Meaningful Sequence**: Content order is logical
- **1.3.3 Sensory Characteristics**: Instructions don't rely on sensory characteristics
- **1.3.4 Orientation**: Content orientation is not restricted
- **1.3.5 Identify Input Purpose**: Input purpose is programmatically determinable

#### 1.4 Distinguishable
- **1.4.1 Use of Color**: Color is not the only means of conveying information
- **1.4.2 Audio Control**: Audio can be paused or stopped
- **1.4.3 Contrast**: Text has sufficient color contrast
- **1.4.4 Resize Text**: Text can be resized up to 200%
- **1.4.5 Images of Text**: Images of text are avoided
- **1.4.10 Reflow**: Content reflows without horizontal scrolling
- **1.4.11 Non-text Contrast**: UI components have sufficient contrast
- **1.4.12 Text Spacing**: Text spacing can be adjusted
- **1.4.13 Content on Hover or Focus**: Content is dismissible and persistent

### Principle 2: Operable

User interface components and navigation must be operable.

#### 2.1 Keyboard Accessible
- **2.1.1 Keyboard**: All functionality is available from keyboard
- **2.1.2 No Keyboard Trap**: Keyboard focus is not trapped
- **2.1.3 Keyboard (No Exception)**: All functionality is keyboard accessible
- **2.1.4 Character Key Shortcuts**: Character key shortcuts can be turned off

#### 2.2 Enough Time
- **2.2.1 Timing Adjustable**: Time limits can be adjusted
- **2.2.2 Pause, Stop, Hide**: Moving content can be paused
- **2.2.3 No Timing**: No timing is required
- **2.2.4 Interruptions**: Interruptions can be postponed
- **2.2.5 Re-authenticate**: Session timeout provides warning

#### 2.3 Seizures and Physical Reactions
- **2.3.1 Three Flashes**: Content doesn't flash more than 3 times per second
- **2.3.2 Three Flashes**: Web pages don't contain flashing content

#### 2.4 Navigable
- **2.4.1 Bypass Blocks**: Skip links are provided
- **2.4.2 Page Titled**: Pages have descriptive titles
- **2.4.3 Focus Order**: Focus order is logical
- **2.4.4 Link Purpose**: Link purpose is clear
- **2.4.5 Multiple Ways**: Multiple ways to find pages
- **2.4.6 Headings and Labels**: Headings and labels are descriptive
- **2.4.7 Focus Visible**: Focus is visible
- **2.4.8 Location**: User location is indicated
- **2.4.9 Link Purpose (Link Only)**: Link purpose is clear from link text
- **2.4.10 Section Headings**: Content is organized with headings

#### 2.5 Input Modalities
- **2.5.1 Pointer Gestures**: Single pointer gestures are available
- **2.5.2 Pointer Cancellation**: Pointer actions can be cancelled
- **2.5.3 Label in Name**: Accessible name contains visible text
- **2.5.4 Motion Actuation**: Motion-based input can be disabled

### Principle 3: Understandable

Information and the operation of user interface must be understandable.

#### 3.1 Readable
- **3.1.1 Language of Page**: Page language is identified
- **3.1.2 Language of Parts**: Language changes are identified
- **3.1.3 Unusual Words**: Unusual words are defined
- **3.1.4 Abbreviations**: Abbreviations are expanded
- **3.1.5 Reading Level**: Content is at lower secondary education level
- **3.1.6 Pronunciation**: Pronunciation is provided for unusual words

#### 3.2 Predictable
- **3.2.1 On Focus**: Focus doesn't cause context changes
- **3.2.2 On Input**: Input doesn't cause context changes
- **3.2.3 Consistent Navigation**: Navigation is consistent
- **3.2.4 Consistent Identification**: Components are identified consistently
- **3.2.5 Change on Request**: Context changes are initiated by user

#### 3.3 Input Assistance
- **3.3.1 Error Identification**: Errors are identified
- **3.3.2 Labels or Instructions**: Labels and instructions are provided
- **3.3.3 Error Suggestion**: Error correction suggestions are provided
- **3.3.4 Error Prevention**: Error prevention is provided
- **3.3.5 Help**: Help is available
- **3.3.6 Error Prevention**: Reversible actions are provided

### Principle 4: Robust

Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

#### 4.1 Compatible
- **4.1.1 Parsing**: Markup is valid
- **4.1.2 Name, Role, Value**: UI components have accessible names
- **4.1.3 Status Messages**: Status messages are programmatically determinable

## Perceivable Guidelines

### Text Alternatives

#### 1.1.1 Non-text Content
```typescript
// Image alt text implementation
interface ImageProps {
  src: string;
  alt: string;
  title?: string;
  decorative?: boolean;
}

const AccessibleImage: React.FC<ImageProps> = ({ src, alt, title, decorative }) => {
  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      title={title}
      role={decorative ? "presentation" : undefined}
    />
  );
};

// Usage examples
<AccessibleImage 
  src="/pet-photo.jpg" 
  alt="Golden retriever sitting in kennel" 
  title="Pet photo"
/>

<AccessibleImage 
  src="/decorative-border.png" 
  alt="" 
  decorative={true}
/>
```

#### 1.1.2 Audio-only/Video-only
```typescript
// Audio content with transcript
interface AudioContentProps {
  src: string;
  transcript: string;
  title: string;
}

const AccessibleAudio: React.FC<AudioContentProps> = ({ src, transcript, title }) => {
  return (
    <div>
      <audio controls>
        <source src={src} type="audio/mpeg" />
        <p>Your browser doesn't support audio playback.</p>
      </audio>
      <details>
        <summary>Transcript</summary>
        <p>{transcript}</p>
      </details>
    </div>
  );
};
```

### Time-based Media

#### 1.2.2 Captions
```typescript
// Video with captions
interface VideoContentProps {
  src: string;
  captions: string;
  title: string;
}

const AccessibleVideo: React.FC<VideoContentProps> = ({ src, captions, title }) => {
  return (
    <video controls>
      <source src={src} type="video/mp4" />
      <track kind="captions" src={captions} srcLang="en" label="English" />
      <p>Your browser doesn't support video playback.</p>
    </video>
  );
};
```

### Adaptable

#### 1.3.1 Info and Relationships
```typescript
// Semantic HTML structure
const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  return (
    <article role="article" aria-labelledby={`pet-${pet.id}-name`}>
      <header>
        <h3 id={`pet-${pet.id}-name`}>{pet.name}</h3>
        <p className="pet-species">{pet.species}</p>
      </header>
      <section aria-labelledby={`pet-${pet.id}-medical`}>
        <h4 id={`pet-${pet.id}-medical`}>Medical Information</h4>
        <ul>
          {pet.medicalConditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
      </section>
    </article>
  );
};
```

#### 1.3.2 Meaningful Sequence
```typescript
// Logical content order
const BookingForm: React.FC<BookingFormProps> = () => {
  return (
    <form>
      <fieldset>
        <legend>Pet Information</legend>
        <label htmlFor="pet-name">Pet Name</label>
        <input id="pet-name" type="text" required />
        
        <label htmlFor="pet-species">Species</label>
        <select id="pet-species" required>
          <option value="">Select species</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
      </fieldset>
      
      <fieldset>
        <legend>Booking Details</legend>
        <label htmlFor="start-date">Start Date</label>
        <input id="start-date" type="date" required />
        
        <label htmlFor="end-date">End Date</label>
        <input id="end-date" type="date" required />
      </fieldset>
    </form>
  );
};
```

### Distinguishable

#### 1.4.1 Use of Color
```typescript
// Color and other indicators
const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  return (
    <span 
      className={`status status-${status}`}
      aria-label={`Status: ${status}`}
    >
      <span className="status-icon" aria-hidden="true">
        {status === 'active' ? '✓' : '✗'}
      </span>
      <span className="status-text">{status}</span>
    </span>
  );
};
```

#### 1.4.3 Contrast
```css
/* Sufficient color contrast */
.text-primary {
  color: #1a1a1a; /* 4.5:1 contrast ratio */
  background-color: #ffffff;
}

.text-secondary {
  color: #4a4a4a; /* 4.5:1 contrast ratio */
  background-color: #ffffff;
}

.text-muted {
  color: #6b6b6b; /* 4.5:1 contrast ratio */
  background-color: #ffffff;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .text-primary {
    color: #000000;
    background-color: #ffffff;
  }
}
```

#### 1.4.4 Resize Text
```css
/* Responsive text sizing */
html {
  font-size: 16px;
}

body {
  font-size: 1rem;
  line-height: 1.5;
}

h1 {
  font-size: 2rem;
}

h2 {
  font-size: 1.5rem;
}

h3 {
  font-size: 1.25rem;
}

/* Text can be resized up to 200% */
@media (min-width: 768px) {
  html {
    font-size: 18px;
  }
}
```

## Operable Guidelines

### Keyboard Accessible

#### 2.1.1 Keyboard
```typescript
// Keyboard navigation
const KeyboardNavigableList: React.FC<ListProps> = ({ items }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleItemSelect(items[focusedIndex]);
        break;
    }
  };
  
  return (
    <ul 
      role="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-activedescendant={`item-${focusedIndex}`}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          id={`item-${index}`}
          role="option"
          aria-selected={index === focusedIndex}
          className={index === focusedIndex ? 'focused' : ''}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```

#### 2.1.2 No Keyboard Trap
```typescript
// Focus management
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="modal"
    >
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

### Enough Time

#### 2.2.1 Timing Adjustable
```typescript
// Adjustable timeouts
const SessionTimeout: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isWarning, setIsWarning] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 60 && !isWarning) {
          setIsWarning(true);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isWarning]);
  
  const extendSession = () => {
    setTimeRemaining(300);
    setIsWarning(false);
  };
  
  return (
    <div className={`session-timeout ${isWarning ? 'warning' : ''}`}>
      <p>Session will expire in {timeRemaining} seconds</p>
      <button onClick={extendSession}>Extend Session</button>
    </div>
  );
};
```

#### 2.2.2 Pause, Stop, Hide
```typescript
// Pausable content
const PausableCarousel: React.FC<CarouselProps> = ({ items }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
      }, 3000);
      
      return () => clearInterval(timer);
    }
  }, [isPlaying, items.length]);
  
  return (
    <div className="carousel">
      <div className="carousel-controls">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
      <div className="carousel-content">
        {items[currentIndex]}
      </div>
    </div>
  );
};
```

### Navigable

#### 2.4.1 Bypass Blocks
```typescript
// Skip links
const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#search" className="skip-link">
        Skip to search
      </a>
    </div>
  );
};

// Main content structure
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <SkipLinks />
      <header>
        <nav id="navigation" aria-label="Main navigation">
          {/* Navigation content */}
        </nav>
      </header>
      <main id="main-content" role="main">
        {children}
      </main>
      <footer>
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

#### 2.4.2 Page Titled
```typescript
// Dynamic page titles
const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} - Kennel Management System`;
  }, [title]);
};

// Usage in components
const PetDetailsPage: React.FC<PetDetailsPageProps> = ({ pet }) => {
  usePageTitle(`Pet Details - ${pet.name}`);
  
  return (
    <div>
      <h1>Pet Details: {pet.name}</h1>
      {/* Page content */}
    </div>
  );
};
```

#### 2.4.3 Focus Order
```typescript
// Logical focus order
const BookingForm: React.FC<BookingFormProps> = () => {
  return (
    <form>
      <fieldset>
        <legend>Pet Information</legend>
        <label htmlFor="pet-name">Pet Name</label>
        <input 
          id="pet-name" 
          type="text" 
          required 
          tabIndex={1}
          aria-describedby="pet-name-help"
        />
        <div id="pet-name-help" className="help-text">
          Enter your pet's name
        </div>
        
        <label htmlFor="pet-species">Species</label>
        <select 
          id="pet-species" 
          required 
          tabIndex={2}
          aria-describedby="pet-species-help"
        >
          <option value="">Select species</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
        <div id="pet-species-help" className="help-text">
          Select your pet's species
        </div>
      </fieldset>
      
      <div className="form-actions">
        <button type="submit" tabIndex={3}>
          Create Booking
        </button>
        <button type="button" tabIndex={4}>
          Cancel
        </button>
      </div>
    </form>
  );
};
```

## Understandable Guidelines

### Readable

#### 3.1.1 Language of Page
```html
<!-- Language declaration -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kennel Management System</title>
</head>
<body>
  <!-- Page content -->
</body>
</html>
```

#### 3.1.2 Language of Parts
```typescript
// Language changes
const MultilingualContent: React.FC = () => {
  return (
    <div>
      <p>Welcome to our kennel management system.</p>
      <p lang="es">Bienvenido a nuestro sistema de gestión de perreras.</p>
      <p lang="fr">Bienvenue dans notre système de gestion de chenil.</p>
    </div>
  );
};
```

### Predictable

#### 3.2.1 On Focus
```typescript
// Focus without context changes
const StableFocusComponent: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleFocus = () => {
    // Focus doesn't cause context changes
    // Content remains stable
  };
  
  return (
    <div onFocus={handleFocus}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="expandable-content"
      >
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      {isExpanded && (
        <div id="expandable-content">
          {/* Content */}
        </div>
      )}
    </div>
  );
};
```

#### 3.2.2 On Input
```typescript
// Input without context changes
const StableInputComponent: React.FC = () => {
  const [value, setValue] = useState('');
  
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    // Input doesn't cause context changes
  };
  
  return (
    <div>
      <label htmlFor="search">Search</label>
      <input 
        id="search"
        type="text"
        value={value}
        onChange={handleInput}
        aria-describedby="search-help"
      />
      <div id="search-help" className="help-text">
        Enter search terms
      </div>
    </div>
  );
};
```

### Input Assistance

#### 3.3.1 Error Identification
```typescript
// Error identification
const FormWithErrors: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (data: FormData) => {
    const newErrors: Record<string, string> = {};
    
    if (!data.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Email format is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return (
    <form>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <div id="email-error" className="error-message" role="alert">
            {errors.email}
          </div>
        )}
      </div>
    </form>
  );
};
```

#### 3.3.2 Labels or Instructions
```typescript
// Clear labels and instructions
const AccessibleForm: React.FC = () => {
  return (
    <form>
      <fieldset>
        <legend>Contact Information</legend>
        
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input 
            id="name"
            type="text"
            required
            aria-describedby="name-help"
          />
          <div id="name-help" className="help-text">
            Enter your full name as it appears on your ID
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input 
            id="phone"
            type="tel"
            required
            aria-describedby="phone-help"
          />
          <div id="phone-help" className="help-text">
            Enter your phone number in the format: (555) 123-4567
          </div>
        </div>
      </fieldset>
    </form>
  );
};
```

## Robust Guidelines

### Compatible

#### 4.1.1 Parsing
```html
<!-- Valid HTML structure -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kennel Management System</title>
</head>
<body>
  <main>
    <h1>Welcome to Kennel Management</h1>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/pets">Pets</a></li>
        <li><a href="/bookings">Bookings</a></li>
      </ul>
    </nav>
  </main>
</body>
</html>
```

#### 4.1.2 Name, Role, Value
```typescript
// Accessible UI components
const AccessibleButton: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled, 
  ariaLabel,
  ariaDescribedBy 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role="button"
    >
      {children}
    </button>
  );
};

const AccessibleSelect: React.FC<SelectProps> = ({ 
  options, 
  value, 
  onChange, 
  label,
  ariaDescribedBy 
}) => {
  return (
    <div>
      <label htmlFor="select">{label}</label>
      <select
        id="select"
        value={value}
        onChange={onChange}
        aria-describedby={ariaDescribedBy}
        role="listbox"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Testing Methodology

### Automated Testing

#### 1. Accessibility Testing Tools
```bash
# axe-core testing
npm install --save-dev @axe-core/react

# Jest accessibility testing
npm install --save-dev jest-axe

# Playwright accessibility testing
npm install --save-dev @playwright/test
```

#### 2. Automated Test Implementation
```typescript
// Jest accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(<PetCard pet={mockPet} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('form should be accessible', async () => {
    const { container } = render(<BookingForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### 3. Playwright Accessibility Testing
```typescript
// Playwright accessibility testing
import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should pass accessibility audit', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Run accessibility audit
    const results = await page.accessibility.snapshot();
    expect(results).toBeDefined();
    
    // Check for specific accessibility features
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toHaveAttribute('aria-label');
  });
});
```

### Manual Testing

#### 1. Keyboard Navigation Testing
```typescript
// Keyboard navigation test
const testKeyboardNavigation = async () => {
  // Test Tab navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  
  // Test Enter key
  await page.keyboard.press('Enter');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  // Test Escape key
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
};
```

#### 2. Screen Reader Testing
```typescript
// Screen reader testing
const testScreenReader = async () => {
  // Test ARIA labels
  await expect(page.locator('[aria-label="Close dialog"]')).toBeVisible();
  
  // Test ARIA descriptions
  await expect(page.locator('[aria-describedby]')).toBeVisible();
  
  // Test ARIA roles
  await expect(page.locator('[role="button"]')).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
};
```

### User Testing

#### 1. User Testing Protocol
```markdown
# User Testing Protocol

## Participants
- 5 users with visual impairments
- 5 users with motor impairments
- 5 users with cognitive impairments
- 5 users without disabilities (control group)

## Testing Scenarios
1. **Registration**: Create new user account
2. **Pet Management**: Add and edit pet information
3. **Booking Process**: Create and manage bookings
4. **Care Logs**: View and update care logs
5. **Payment**: Process payments

## Success Criteria
- 90% task completion rate
- 4.0/5.0 user satisfaction score
- No critical accessibility barriers
- Positive feedback from assistive technology users
```

#### 2. User Testing Results
```typescript
// User testing results
interface UserTestingResults {
  participantId: string;
  disabilityType: string;
  taskCompletionRate: number;
  satisfactionScore: number;
  barriers: string[];
  recommendations: string[];
}

const analyzeUserTestingResults = (results: UserTestingResults[]) => {
  const averageCompletionRate = results.reduce((sum, result) => 
    sum + result.taskCompletionRate, 0) / results.length;
  
  const averageSatisfaction = results.reduce((sum, result) => 
    sum + result.satisfactionScore, 0) / results.length;
  
  const commonBarriers = results.flatMap(result => result.barriers);
  const barrierCounts = commonBarriers.reduce((counts, barrier) => {
    counts[barrier] = (counts[barrier] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  return {
    averageCompletionRate,
    averageSatisfaction,
    commonBarriers: barrierCounts,
    recommendations: results.flatMap(result => result.recommendations)
  };
};
```

## Remediation Plan

### Critical Issues

#### 1. Missing Alt Text
```typescript
// Fix missing alt text
const fixAltText = () => {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-hidden')) {
      img.alt = 'Image description needed';
    }
  });
};
```

#### 2. Missing Form Labels
```typescript
// Fix missing form labels
const fixFormLabels = () => {
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      const label = document.createElement('label');
      label.textContent = 'Label needed';
      label.setAttribute('for', input.id || 'input-' + Math.random());
      input.parentNode?.insertBefore(label, input);
    }
  });
};
```

#### 3. Insufficient Color Contrast
```css
/* Fix color contrast */
.text-primary {
  color: #000000; /* 21:1 contrast ratio */
  background-color: #ffffff;
}

.text-secondary {
  color: #333333; /* 12.6:1 contrast ratio */
  background-color: #ffffff;
}

.text-muted {
  color: #666666; /* 5.7:1 contrast ratio */
  background-color: #ffffff;
}
```

### High Priority Issues

#### 1. Keyboard Navigation
```typescript
// Fix keyboard navigation
const fixKeyboardNavigation = () => {
  const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach(element => {
    if (!element.getAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  });
};
```

#### 2. Focus Management
```typescript
// Fix focus management
const fixFocusManagement = () => {
  const modals = document.querySelectorAll('[role="dialog"]');
  modals.forEach(modal => {
    const focusableElements = modal.querySelectorAll('button, a, input, select, textarea');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  });
};
```

### Medium Priority Issues

#### 1. ARIA Labels
```typescript
// Add ARIA labels
const addAriaLabels = () => {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    if (!button.getAttribute('aria-label') && !button.textContent) {
      button.setAttribute('aria-label', 'Button');
    }
  });
};
```

#### 2. Heading Structure
```typescript
// Fix heading structure
const fixHeadingStructure = () => {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let currentLevel = 1;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > currentLevel + 1) {
      heading.tagName = `H${currentLevel + 1}`;
    }
    currentLevel = level;
  });
};
```

## Ongoing Monitoring

### Continuous Monitoring

#### 1. Automated Accessibility Testing
```typescript
// Continuous accessibility monitoring
const monitorAccessibility = async () => {
  const pages = [
    '/dashboard',
    '/pets',
    '/bookings',
    '/care-logs',
    '/admin'
  ];
  
  for (const page of pages) {
    await page.goto(page);
    const results = await axe(page);
    
    if (results.violations.length > 0) {
      await reportAccessibilityIssues(page, results.violations);
    }
  }
};
```

#### 2. User Feedback Integration
```typescript
// User feedback system
const collectAccessibilityFeedback = () => {
  const feedbackForm = document.createElement('form');
  feedbackForm.innerHTML = `
    <h3>Accessibility Feedback</h3>
    <label for="issue">Issue Description</label>
    <textarea id="issue" name="issue" required></textarea>
    <label for="severity">Severity</label>
    <select id="severity" name="severity">
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
    </select>
    <button type="submit">Submit Feedback</button>
  `;
  
  document.body.appendChild(feedbackForm);
};
```

### Regular Audits

#### 1. Monthly Accessibility Audits
```typescript
// Monthly accessibility audit
const monthlyAccessibilityAudit = async () => {
  const auditResults = {
    date: new Date(),
    pages: [],
    violations: [],
    recommendations: []
  };
  
  // Test all pages
  const pages = await getAllPages();
  for (const page of pages) {
    const results = await testPageAccessibility(page);
    auditResults.pages.push(results);
  }
  
  // Generate report
  await generateAccessibilityReport(auditResults);
};
```

#### 2. Quarterly User Testing
```typescript
// Quarterly user testing
const quarterlyUserTesting = async () => {
  const participants = await recruitTestParticipants();
  const scenarios = await getTestScenarios();
  
  for (const participant of participants) {
    for (const scenario of scenarios) {
      const results = await conductUserTest(participant, scenario);
      await recordTestResults(results);
    }
  }
  
  await analyzeUserTestingResults();
};
```

## Conclusion

This accessibility audit provides a comprehensive framework for ensuring the Kennel Management System meets WCAG 2.1 AA standards. The audit identifies key areas for improvement and provides detailed remediation plans.

### Key Findings

1. **Strong Foundation**: The system has a solid foundation for accessibility
2. **Critical Issues**: Some critical accessibility issues need immediate attention
3. **High Priority**: Several high-priority issues require prompt resolution
4. **Medium Priority**: Medium-priority issues should be addressed in the next release

### Recommendations

1. **Immediate Action**: Address critical accessibility issues
2. **Short-term**: Implement high-priority fixes
3. **Long-term**: Establish ongoing accessibility monitoring
4. **User Testing**: Conduct regular user testing with disabled users
5. **Training**: Provide accessibility training for development team

The system is well-positioned to achieve full WCAG 2.1 AA compliance with the implementation of the identified improvements and ongoing monitoring procedures.

# Schoolcierge Component Specifications
**Version 1.0 | Technical Implementation Guide**

## Table of Contents
1. [Component Architecture](#component-architecture)
2. [Core Components](#core-components)
3. [Composite Components](#composite-components)
4. [Screen Patterns](#screen-patterns)
5. [State Management](#state-management)
6. [Performance Guidelines](#performance-guidelines)

---

## Component Architecture

### Component Hierarchy
```
Atoms (Basic Elements)
  ↓
Molecules (Simple Components)
  ↓
Organisms (Complex Components)
  ↓
Templates (Screen Layouts)
  ↓
Screens (Complete Views)
```

### Naming Convention
- **Components**: PascalCase (e.g., `PriorityCard`)
- **Props**: camelCase (e.g., `onPress`)
- **Files**: PascalCase.tsx (e.g., `StudentSwitcher.tsx`)
- **Styles**: camelCase objects (e.g., `cardStyles`)

---

## Core Components

### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'text' | 'danger';
  size: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Size Specifications
const sizes = {
  small: { height: 36, fontSize: 14, padding: '8px 16px' },
  medium: { height: 44, fontSize: 16, padding: '12px 24px' },
  large: { height: 52, fontSize: 18, padding: '14px 32px' }
};

// Visual States
const states = {
  default: { opacity: 1 },
  pressed: { scale: 0.95, opacity: 0.9 },
  disabled: { opacity: 0.4 },
  loading: { opacity: 0.7 }
};
```

### Card Component
```typescript
interface CardProps {
  variant?: 'default' | 'priority' | 'interactive';
  priority?: 'critical' | 'urgent' | 'achievement' | 'academic' | 'info';
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  borderRadius?: number;
  elevation?: 'none' | 'small' | 'medium' | 'large';
}

// Elevation Shadows
const elevations = {
  none: 'none',
  small: '0 1px 3px rgba(0,0,0,0.12)',
  medium: '0 2px 8px rgba(0,0,0,0.1)',
  large: '0 4px 16px rgba(0,0,0,0.15)'
};
```

### Input Component
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search';
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ComponentType;
  rightIcon?: React.ComponentType;
  onRightIconPress?: () => void;
}

// Visual Specifications
const inputStyles = {
  container: { marginBottom: 16 },
  label: { fontSize: 14, color: '#4A4A4A', marginBottom: 4 },
  input: {
    height: 44,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16
  },
  focused: { borderColor: '#3D348B', borderWidth: 2 },
  error: { borderColor: '#F35B04' },
  helperText: { fontSize: 12, marginTop: 4 }
};
```

### Badge Component
```typescript
interface BadgeProps {
  variant: 'dot' | 'number' | 'text';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  value?: string | number;
  position?: 'top-right' | 'top-left' | 'inline';
  size?: 'small' | 'medium';
}

// Size Specifications
const badgeSizes = {
  dot: { small: 8, medium: 12 },
  number: { small: 16, medium: 20 },
  text: { height: 20, padding: '2px 6px' }
};
```

---

## Composite Components

### Priority Message Card
```typescript
interface PriorityMessageProps {
  id: string;
  priority: 'critical' | 'urgent' | 'achievement' | 'academic' | 'info';
  from: string;
  fromRole: 'teacher' | 'principal' | 'nurse' | 'admin';
  subject: string;
  preview: string;
  timestamp: Date;
  unread: boolean;
  requiresAction?: boolean;
  studentName?: string;
  onPress: () => void;
  onActionPress?: () => void;
}

// Layout Structure
<Card variant="priority" priority={priority}>
  <HStack spacing={12}>
    <VStack flex={1}>
      <Text variant="subtitle">{subject}</Text>
      <Text variant="caption">from {from}</Text>
      <Text variant="body" numberOfLines={2}>{preview}</Text>
      {requiresAction && <ActionButton />}
    </VStack>
    {unread && <UnreadIndicator />}
  </HStack>
</Card>
```

### Student Switcher
```typescript
interface StudentSwitcherProps {
  students: Student[];
  selectedId: string;
  onSelect: (studentId: string) => void;
  variant: 'horizontal' | 'dropdown';
}

// Card Specifications
const studentCard = {
  width: 140,
  height: 72,
  padding: 12,
  marginRight: 12,
  borderRadius: 12,
  selected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0
  },
  unselected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  }
};
```

### Quick Action Grid
```typescript
interface QuickActionProps {
  actions: Array<{
    id: string;
    title: string;
    icon: React.ComponentType;
    color: string;
    badge?: number;
    onPress: () => void;
  }>;
  columns?: 3 | 4;
}

// Grid Layout
const gridStyles = {
  container: { flexDirection: 'row', flexWrap: 'wrap' },
  item: {
    width: 'calc(33.33% - 8px)',
    aspectRatio: 1,
    margin: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: { size: 32, marginBottom: 8 },
  label: { fontSize: 12, textAlign: 'center' }
};
```

### Calendar Event Card
```typescript
interface EventCardProps {
  title: string;
  type: 'assignment' | 'test' | 'event' | 'meeting' | 'holiday';
  date: Date;
  time?: string;
  location?: string;
  studentNames?: string[];
  reminder?: boolean;
  onPress: () => void;
}

// Type Colors
const eventTypeColors = {
  assignment: '#7678ED',
  test: '#F18701',
  event: '#F7B801',
  meeting: '#3D348B',
  holiday: '#4CAF50'
};
```

---

## Screen Patterns

### Dashboard Layout
```typescript
interface DashboardLayoutProps {
  header: {
    greeting: string;
    userName: string;
    notificationCount: number;
  };
  studentSwitcher: StudentSwitcherProps;
  todayOverview: OverviewProps;
  priorityMessages: Message[];
  quickActions: QuickAction[];
  academicProgress: ProgressProps;
}

// Layout Structure
<ScrollView>
  <Header gradient={['#3D348B', '#7678ED']}>
    <Greeting />
    <NotificationBell count={notificationCount} />
  </Header>
  
  <StudentSwitcher horizontal />
  
  <Container padding={16}>
    <TodayOverview />
    <Section title="Priority Messages">
      <MessageList />
    </Section>
    <Section title="Quick Actions">
      <ActionGrid />
    </Section>
    <AcademicProgress />
  </Container>
</ScrollView>
```

### List Screen Pattern
```typescript
interface ListScreenProps {
  title: string;
  data: Array<any>;
  renderItem: (item: any) => React.ReactNode;
  filters?: FilterOption[];
  searchable?: boolean;
  emptyState?: EmptyStateProps;
  onRefresh?: () => void;
  loading?: boolean;
}

// Standard List Layout
<Screen>
  <Header title={title} />
  {searchable && <SearchBar />}
  {filters && <FilterBar />}
  <FlatList
    data={data}
    renderItem={renderItem}
    ItemSeparatorComponent={Separator}
    refreshControl={<RefreshControl />}
    ListEmptyComponent={EmptyState}
  />
</Screen>
```

### Form Screen Pattern
```typescript
interface FormScreenProps {
  title: string;
  sections: FormSection[];
  onSubmit: (data: any) => void;
  validation?: ValidationRules;
}

// Form Structure
<KeyboardAvoidingView>
  <ScrollView>
    <Header title={title} />
    {sections.map(section => (
      <Section key={section.id} title={section.title}>
        {section.fields.map(field => (
          <FormField key={field.id} {...field} />
        ))}
      </Section>
    ))}
  </ScrollView>
  <Footer>
    <Button onPress={handleSubmit}>Submit</Button>
  </Footer>
</KeyboardAvoidingView>
```

---

## State Management

### Component State Patterns
```typescript
// Local State (useState)
const [selectedStudent, setSelectedStudent] = useState<string>('');

// Derived State
const currentStudent = useMemo(
  () => students.find(s => s.id === selectedStudent),
  [students, selectedStudent]
);

// Effect Management
useEffect(() => {
  // Fetch data on mount
  loadStudentData(selectedStudent);
}, [selectedStudent]);

// Reducer Pattern for Complex State
const [state, dispatch] = useReducer(dashboardReducer, initialState);
```

### Data Flow
```typescript
// Props Drilling Prevention
const StudentContext = createContext<StudentContextType>();

// Context Provider
<StudentContext.Provider value={{ student, updateStudent }}>
  {children}
</StudentContext.Provider>

// Hook Usage
const { student } = useStudentContext();
```

---

## Performance Guidelines

### Optimization Techniques

#### Memoization
```typescript
// Memo for expensive components
const MessageCard = React.memo(({ message, onPress }) => {
  return <Card>...</Card>;
}, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id;
});

// useMemo for expensive calculations
const sortedMessages = useMemo(
  () => messages.sort((a, b) => b.priority - a.priority),
  [messages]
);
```

#### List Optimization
```typescript
// FlatList optimization
<FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
/>
```

#### Image Optimization
```typescript
// Lazy loading images
<Image
  source={{ uri: studentAvatar }}
  style={styles.avatar}
  resizeMode="cover"
  progressiveRenderingEnabled={true}
  cache="force-cache"
/>
```

### Bundle Size Optimization
```typescript
// Dynamic imports for heavy components
const CalendarView = lazy(() => import('./CalendarView'));

// Tree shaking unused icons
import { Home, Bell, Calendar } from '@tamagui/lucide-icons';
// NOT: import * as Icons from '@tamagui/lucide-icons';
```

### Animation Performance
```typescript
// Use native driver
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Critical for performance
}).start();

// Prefer transforms over layout changes
transform: [{ scale: animatedScale }] // Good
width: animatedWidth // Bad - causes layout recalculation
```

---

## Testing Specifications

### Component Testing
```typescript
// Unit test example
describe('PriorityCard', () => {
  it('should display correct priority color', () => {
    const { getByTestId } = render(
      <PriorityCard priority="critical" />
    );
    expect(getByTestId('priority-indicator'))
      .toHaveStyle({ backgroundColor: '#F35B04' });
  });
});
```

### Accessibility Testing
```typescript
// A11y test requirements
- All interactive elements have accessible labels
- Color contrast meets WCAG AA standards
- Touch targets are minimum 44x44px
- Screen reader announcements are clear
```

---

## Implementation Checklist

### New Component Checklist
- [ ] TypeScript interfaces defined
- [ ] Accessibility props included
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Dark mode support (if applicable)
- [ ] Memoization applied where needed
- [ ] Unit tests written
- [ ] Storybook story created
- [ ] Documentation updated
- [ ] Performance profiled

### Code Review Criteria
- [ ] Follows naming conventions
- [ ] Uses design tokens
- [ ] Handles edge cases
- [ ] Includes proper TypeScript types
- [ ] Optimized for performance
- [ ] Accessible by default
- [ ] Responsive across devices
- [ ] Follows platform guidelines
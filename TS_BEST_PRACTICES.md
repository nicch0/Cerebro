# TypeScript Best Practices Reference Guide

## Factory Functions

- **Return Type Annotations**: Always specify return types for factory functions to ensure consistent interfaces.
  ```typescript
  function createCounter(): Counter {
    // implementation
  }
  ```

- **Generic Factory Functions**: Use generics to create reusable factory functions.
  ```typescript
  function createStore<T>(initialValue: T): Store<T> {
    // implementation
  }
  ```

- **Builder Pattern**: Consider using builder pattern for complex object creation with many optional parameters.

## Async Methods

- **Promise Return Types**: Always specify the return type of async functions.
  ```typescript
  async function fetchData(): Promise<ResponseData> {
    // implementation
  }
  ```

- **Error Handling**: Use try/catch blocks or result type patterns instead of uncaught promises.
  ```typescript
  async function safeOperation(): Promise<Result<Data, Error>> {
    try {
      const data = await riskyOperation();
      return { success: true, value: data };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }
  ```

- **Async Factory Functions**: For async initialization, return a Promise of the instance.
  ```typescript
  async function createAsyncStore<T>(initializer: () => Promise<T>): Promise<Store<T>> {
    const initialValue = await initializer();
    return createStore(initialValue);
  }
  ```

## This Binding

- **Arrow Functions**: Use arrow functions to preserve `this` context in callbacks.
  ```typescript
  class EventHandler {
    private events: Event[] = [];
    
    handleEvent = (event: Event) => {  // Arrow function preserves 'this'
      this.events.push(event);
    }
  }
  ```

- **Method Binding**: Explicitly bind methods that will be passed as callbacks.
  ```typescript
  constructor() {
    this.handleClick = this.handleClick.bind(this);
  }
  ```

- **Avoid `this` in Utility Functions**: Pure utility functions should not rely on `this` context.

## ReturnType Utility

- **Extract Function Return Types**: Use ReturnType to derive types from function returns.
  ```typescript
  function createUser() {
    return { id: 0, name: "" };
  }
  
  type User = ReturnType<typeof createUser>;
  ```

- **Component Props from Factories**: Use ReturnType to derive component prop types from factory functions.
  ```typescript
  function createChatState() {
    return {
      messages: [],
      isStreaming: false
    };
  }
  
  type ChatProps = {
    state: ReturnType<typeof createChatState>;
  }
  ```

- **API Response Typing**: Use ReturnType to type API responses based on handler functions.

## Type Safety

- **Discriminated Unions**: Use literal type properties to create type-safe unions.
  ```typescript
  type Success = { status: "success"; data: Response };
  type Error = { status: "error"; message: string };
  type Result = Success | Error;
  
  function handleResult(result: Result) {
    if (result.status === "success") {
      // TypeScript knows result is Success type here
      processData(result.data);
    } else {
      // TypeScript knows result is Error type here
      logError(result.message);
    }
  }
  ```

- **Exhaustiveness Checking**: Use never type for exhaustive switch statements.
  ```typescript
  function assertNever(x: never): never {
    throw new Error("Unexpected object: " + x);
  }
  
  function handleShape(shape: Shape) {
    switch(shape.kind) {
      case "circle": return calculateCircleArea(shape);
      case "square": return calculateSquareArea(shape);
      case "triangle": return calculateTriangleArea(shape);
      default: return assertNever(shape); // Error if Shape has more types
    }
  }
  ```

- **Strict Null Checking**: Enable `strictNullChecks` in tsconfig.json to catch null/undefined errors.

- **Type Guards**: Create custom type guards for runtime type checking.
  ```typescript
  function isUser(obj: any): obj is User {
    return obj && typeof obj === "object" && "id" in obj && "name" in obj;
  }
  ```

## Svelte 5 Store Patterns

- **Type-Safe Stores**: Define types for store values and use them consistently.
  ```typescript
  type MessageStore = {
    messages: Message[];
    addMessage: (message: Message) => void;
  }
  
  function createMessageStore(): MessageStore {
    const messages = $state([]);
    
    return {
      get messages() { return messages; },
      addMessage: (message) => { messages.push(message); }
    };
  }
  ```

- **Composition**: Compose smaller stores into larger stores for complex state.
  ```typescript
  function createAppStore(): AppStore {
    const messages = createMessageStore();
    const users = createUserStore();
    
    return {
      messages,
      users,
      // Additional methods that use both stores
    };
  }
  ```

- **Immutable Patterns**: Prefer immutable update patterns for state management.
  ```typescript
  function updateMessage(messages: Message[], id: string, update: Partial<Message>): Message[] {
    return messages.map(msg => 
      msg.id === id ? { ...msg, ...update } : msg
    );
  }
  ```

## General Best Practices

- **Avoid Type Assertions**: Minimize use of type assertions (`as` keyword) and prefer proper type guards.

- **Readonly Modifiers**: Use `readonly` for arrays and properties that should not be modified.
  ```typescript
  function processItems(items: readonly Item[]): Summary {
    // Cannot accidentally modify items here
  }
  ```

- **Interface vs Type**: Use interfaces for public APIs and types for complex unions or utility types.

- **Don't Export Implementation Details**: Export only the interfaces and types needed by consumers.

- **Consistent Naming**: Use descriptive, consistent type naming conventions throughout the codebase.
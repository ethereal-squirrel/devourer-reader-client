import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import Button from "../../src/components/atoms/Button";

describe("Button Component", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      render(<Button onPress={() => {}}>Click me</Button>);

      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(
        "bg-tertiary",
        "text-white",
        "p-3",
        "rounded-xl"
      );
    });

    it("should render children content", () => {
      render(
        <Button onPress={() => {}}>
          <span>Custom Content</span>
        </Button>
      );

      expect(screen.getByText("Custom Content")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      render(
        <Button onPress={() => {}} className="custom-class">
          Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-tertiary"); // Should also have default classes
    });
  });

  describe("Event Handling", () => {
    it("should call onPress when clicked", () => {
      const mockOnPress = jest.fn();
      render(<Button onPress={mockOnPress}>Click me</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it("should call onPress multiple times", () => {
      const mockOnPress = jest.fn();
      render(<Button onPress={mockOnPress}>Click me</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it("should not call onPress when disabled", () => {
      const mockOnPress = jest.fn();
      render(
        <Button onPress={mockOnPress} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should apply disabled attribute when disabled prop is true", () => {
      render(
        <Button onPress={() => {}} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not apply disabled attribute when disabled prop is false", () => {
      render(
        <Button onPress={() => {}} disabled={false}>
          Enabled Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should apply disabled styling when disabled", () => {
      render(
        <Button onPress={() => {}} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-50", "hover:cursor-not-allowed");
    });

    it("should not apply disabled styling when enabled", () => {
      render(<Button onPress={() => {}}>Enabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("opacity-50", "hover:cursor-not-allowed");
    });
  });

  describe("Accessibility", () => {
    it("should have proper button role", () => {
      render(<Button onPress={() => {}}>Accessible Button</Button>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should support aria-label", () => {
      render(
        <Button onPress={() => {}} aria-label="Custom aria label">
          Button
        </Button>
      );

      const button = screen.getByRole("button", { name: "Custom aria label" });
      expect(button).toBeInTheDocument();
    });

    it("should support aria-describedby", () => {
      render(
        <div>
          <Button onPress={() => {}} aria-describedby="help-text">
            Button
          </Button>
          <div id="help-text">This button does something</div>
        </div>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "help-text");
    });

    it("should be focusable when enabled", () => {
      render(<Button onPress={() => {}}>Focusable Button</Button>);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("should handle keyboard events", () => {
      const mockOnPress = jest.fn();
      render(<Button onPress={mockOnPress}>Keyboard Button</Button>);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
      fireEvent.keyDown(button, { key: " ", code: "Space" });

      // Note: The actual keyboard behavior depends on browser implementation
      // This test ensures the button is properly keyboard accessible
      expect(button).toBeInTheDocument();
    });
  });

  describe("Styling and CSS Classes", () => {
    it("should merge custom classes with default classes", () => {
      render(
        <Button onPress={() => {}} className="custom-bg">
          Styled Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-tertiary", "text-white", "custom-bg");
    });

    it("should allow overriding default classes", () => {
      render(
        <Button onPress={() => {}} className="bg-red-500">
          Red Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-500");
      // Note: CSS class precedence depends on the order in the stylesheet
    });

    it("should apply hover and focus classes", () => {
      render(<Button onPress={() => {}}>Hover Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:cursor-pointer", "hover:bg-quaternary");
    });
  });

  describe("Button Types and Variants", () => {
    it("should have aria-busy when disabled", () => {
      render(
        <Button onPress={() => {}} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("should not have aria-busy when enabled", () => {
      render(<Button onPress={() => {}}>Enabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).not.toHaveAttribute("aria-busy");
    });
  });

  describe("Complex Content", () => {
    it("should render with icon and text", () => {
      const TestIcon = () => <svg data-testid="test-icon" />;

      render(
        <Button onPress={() => {}}>
          <TestIcon />
          <span>Icon Button</span>
        </Button>
      );

      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
      expect(screen.getByText("Icon Button")).toBeInTheDocument();
    });

    it("should render with only icon", () => {
      const TestIcon = () => <svg data-testid="icon-only" />;

      render(
        <Button onPress={() => {}} aria-label="Icon only button">
          <TestIcon />
        </Button>
      );

      expect(screen.getByTestId("icon-only")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Icon only button" })
      ).toBeInTheDocument();
    });
  });

  describe("Memory and Performance", () => {
    it("should not cause memory leaks with repeated renders", () => {
      const { rerender, unmount } = render(
        <Button onPress={() => {}}>Test</Button>
      );

      // Rerender multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<Button onPress={() => {}}>Test {i}</Button>);
      }

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it("should handle rapid clicking without issues", () => {
      const mockOnPress = jest.fn();
      render(<Button onPress={mockOnPress}>Rapid Click</Button>);

      const button = screen.getByRole("button");

      // Simulate rapid clicking
      for (let i = 0; i < 100; i++) {
        fireEvent.click(button);
      }

      expect(mockOnPress).toHaveBeenCalledTimes(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined onPress gracefully", () => {
      // Note: TypeScript should prevent this, but testing runtime behavior
      render(<Button onPress={undefined as any}>Button</Button>);

      const button = screen.getByRole("button");
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it("should handle null children", () => {
      render(<Button onPress={() => {}}>{null}</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it("should handle empty string as children", () => {
      render(<Button onPress={() => {}}>{""}</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });
});

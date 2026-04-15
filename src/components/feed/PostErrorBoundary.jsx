import React from 'react';

export default class PostErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn('Post render error (skipped):', error?.message, info?.componentStack?.split('\n')[1]);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
import { Component } from 'react';

// Renders nothing if a feed widget crashes, so one bad widget can't take down the whole feed.
export default class WidgetBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  render() { return this.state.crashed ? null : this.props.children; }
}

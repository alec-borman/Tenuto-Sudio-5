/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SplitWorkspace from './components/SplitWorkspace';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SplitWorkspace />
    </ErrorBoundary>
  );
}

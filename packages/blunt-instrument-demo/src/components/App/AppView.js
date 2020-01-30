import React from 'react';
import './App.css';
import AnnotatedCode from '../AnnotatedCode';
import ASTNav from '../ASTNav';
import TrevTable from '../TrevTable';
import TraceQueryForm from '../TraceQueryForm';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import examples from 'blunt-instrument-test-resources';
import ReactJson from 'react-json-view';
import Modal from 'react-modal';
import { fromNodeKey } from 'blunt-instrument-ast-utils';
import update from 'immutability-helper';

function AppView({
  evalResult,
  tc,
  traceQuery,
  highlightedTrevId,
  highlightedNodeId,
  onTraceQueryChange,
  onHoveredTrevChange,
  onHoveredNodeChange,
  onLoadByPaste,
  onNodeSelectedToggle,
  onRun,
  onSourceDraftChange,
  onOpenModalData,
  onCloseModalData,
  modalData,
  runError,
  sourceDraft,
}) {
  function runHandler(source) {
    return (event) => {
      event.preventDefault();
      onRun(source);
    }
  }

  const onChangeSelectedExample = event => {
    onRun(examples[event.target.value] || '');
  }

  const selectedNodeIds =
    Object.keys(traceQuery.nodes).filter(
      key => traceQuery.nodes[key]).map((nodeKey) => fromNodeKey(nodeKey).nodeId);

  const handleSourceDraftChange =
    (event) => onSourceDraftChange(event.target.value);
  
  let selectedExample = '';
  const exampleOptions = [<option value=""></option>];
  for (const key in examples) {
    exampleOptions.push(<option value={key}>{key}</option>);
    if (sourceDraft === examples[key]) {
      selectedExample = key;
    }
  }

  let status;
  if (runError) {
    status = <p className="status error">{runError.toString()}</p>;
  } else if (evalResult.error) {
    status = <p className="status warning">Completed with error: {evalResult.error.toString()}</p>;
  } else {
    status = <p className="status">Completed successfully.</p>;
  }

  const handleTrevTypeSelectedToggle = (type) => {
    onTraceQueryChange(update(traceQuery, { types: { $toggle: [type] } }));
  };

  const handleLoadByPaste = (event) => {
    const text = (event.clipboardData || window.clipboardData).getData('text');
    if (text) {
      onLoadByPaste(text);
    }
    event.preventDefault();
  }

  return (
    <div className="App">
      <div className="control-tabs">
        <Tabs>
          <TabList>
            <Tab>Run</Tab>
            <Tab>Save</Tab>
            <Tab>Load</Tab>
          </TabList>

          <TabPanel>
            <form className="source-form">
              <p className="instructions">
                Enter javascript code here, then click "Run" to see the trace.
                Or, choose an example:
                <select value={selectedExample} onChange={onChangeSelectedExample}>
                  {exampleOptions}
                </select>
              </p>
              <textarea value={sourceDraft} onChange={handleSourceDraftChange}
                        autoComplete="false"
                        autoCorrect="false"
                        spellCheck="false" />
              <div className="below-source">
                <button className="run" onClick={runHandler(sourceDraft)}>Run</button>
                {status}
              </div>
            </form>
          </TabPanel>

          <TabPanel>
            <div className="save-form">
              <p>You can export the trace &amp; AST to restore later.</p>
              <ul>
                <li><button className="view-save" onClick={() => onOpenModalData(evalResult.tc.asJSON())}>View JSON</button></li>
              </ul>
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="load-form">
              <p>You can load a trace &amp; AST by one of the following methods.</p>
              <ul>
                <li>Paste the JSON here: <input className="load-paste" value="" type="text" onPaste={handleLoadByPaste} /></li>
              </ul>
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <div className="code-tabs">
        <Tabs>
          <TabList>
            <Tab>Code</Tab>
            <Tab>AST</Tab>
            <Tab>AST JSON</Tab>
            {evalResult.instrumentedAST ? <Tab>Instrumented Code</Tab> : null}
          </TabList>

          <TabPanel>
            <AnnotatedCode ast={evalResult.tc.astb.asts.eval}
                           highlightedNodeId={highlightedNodeId}
                           onHoveredNodeChange={onHoveredNodeChange}
                           onNodeSelectedToggle={onNodeSelectedToggle}
                           selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ASTNav ast={evalResult.tc.astb.asts.eval}
                    highlightedNodeId={highlightedNodeId}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle}
                    selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={evalResult.tc.astb.asts.eval} name={false} />
          </TabPanel>
          
          {evalResult.instrumentedAST ?
            <TabPanel>
              <AnnotatedCode ast={evalResult.instrumentedAST}
                            highlightedNodeId={highlightedNodeId}
                            onHoveredNodeChange={onHoveredNodeChange}
                            onNodeSelectedToggle={onNodeSelectedToggle}
                            selectedNodeIds={selectedNodeIds} />
            </TabPanel> : null}
        </Tabs>
      </div>

      <TraceQueryForm highlightedNodeId={highlightedNodeId}
                      onTraceQueryChange={onTraceQueryChange}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      tc={evalResult.tc}
                      query={traceQuery} />

      <div className="trev-tabs">
        <Tabs>
          <TabList>
            <Tab>Trace Events</Tab>
            <Tab>Trevs JSON</Tab>
          </TabList>
          
          <TabPanel>
            <TrevTable trevs={tc.trevs}
                      highlightedTrevId={highlightedTrevId}
                      highlightedNodeId={highlightedNodeId}
                      onHoveredTrevChange={onHoveredTrevChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      onOpenModalData={onOpenModalData}
                      onTrevTypeSelectedToggle={handleTrevTypeSelectedToggle} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={tc.withoutDenormalizedInfo()}
                       name={false}
                       displayDataTypes={false} />
          </TabPanel>
        </Tabs>
      </div>

      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>

      <Modal isOpen={modalData !== undefined}
             onRequestClose={onCloseModalData}
             contentLabel="Data Inspector"
             shouldCloseOnOverlayClick={true}>
        <ReactJson src={modalData}
                   name={false}
                   displayDataTypes={false} />
      </Modal>
    </div>
  );
}

export default AppView;

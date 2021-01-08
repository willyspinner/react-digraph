// @flow
/*
  Copyright(c) 2018 Uber Technologies, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*
  Zoom slider and zoom to fit controls for GraphView
*/

import React, { useCallback, useState, useEffect, useRef } from 'react';
import Parse from 'html-react-parser';
import classnames from 'classnames';
import { DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM, SLIDER_STEPS } from '../constants';
import { useZoomLevelToSliderValue } from '../hooks/useZoomLevelToSliderValue';
import faExpand from '@fortawesome/fontawesome-free/svgs/solid/expand.svg';
import faQuestion from '@fortawesome/fontawesome-free/svgs/solid/question.svg';

const parsedExpandIcon = Parse(faExpand); //  parse SVG once
const parsedQuestionIcon = Parse(faQuestion);
const ExpandIcon = () => parsedExpandIcon; // convert SVG to react component
const QuestionIcon = () => parsedQuestionIcon;

type IGraphControlProps = {
  maxZoom?: number,
  minZoom?: number,
  zoomLevel: number,
  showHelp?: boolean,
  allowMultiSelect?: boolean,
  zoomToFit: (event: SyntheticMouseEvent<HTMLButtonElement>) => void,
  modifyZoom: (delta: number) => boolean,
};

// Convert slider val (0-steps) to original zoom value range
export function sliderToZoom(val: number, minZoom: number, maxZoom: number) {
  return (val * (maxZoom - minZoom)) / SLIDER_STEPS + minZoom;
}

function GraphControls({
  maxZoom = DEFAULT_MAX_ZOOM,
  minZoom = DEFAULT_MIN_ZOOM,
  zoomLevel,
  showHelp,
  allowMultiSelect,
  zoomToFit,
  modifyZoom,
}: IGraphControlProps) {
  const [helpShowing, setHelpShowing] = useState(false);
  const helpContainerRef = useRef();

  // Modify current zoom of graph-view
  const zoom = useCallback(
    (e: any) => {
      const sliderVal = e.target.value;
      const zoomLevelNext = sliderToZoom(sliderVal, minZoom, maxZoom);
      const delta = zoomLevelNext - zoomLevel;

      if (zoomLevelNext <= (maxZoom || 0) && zoomLevelNext >= (minZoom || 0)) {
        modifyZoom(delta);
      }
    },
    [minZoom, maxZoom, zoomLevel, modifyZoom]
  );

  const handleDocumentClick = e => {
    if (!helpContainerRef.current.contains(e.target)) {
      setHelpShowing(false);
    }
  };

  useEffect(() => {
    if (!showHelp) {
      document.removeEventListener('click', handleDocumentClick);

      return;
    }

    // subscribe event
    document.addEventListener('click', handleDocumentClick);

    return () => {
      // unsubscribe event
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showHelp]);

  const min = useZoomLevelToSliderValue(minZoom, minZoom, maxZoom);
  const max = useZoomLevelToSliderValue(maxZoom, minZoom, maxZoom);
  const value = useZoomLevelToSliderValue(zoomLevel, minZoom, maxZoom);

  const helpButtonClassnames = classnames('help-button', {
    'help-showing': helpShowing,
  });

  return (
    <div className="graph-controls">
      <div className="slider-wrapper">
        <span>-</span>
        <input
          type="range"
          className="slider"
          min={min}
          max={max}
          value={value}
          onChange={zoom}
          step="1"
        />
        <span>+</span>
      </div>
      <button type="button" className="slider-button" onMouseDown={zoomToFit}>
        <ExpandIcon />
      </button>
      {showHelp && (
        <div className="help-container" ref={helpContainerRef}>
          <button
            type="button"
            className={helpButtonClassnames}
            onMouseDown={() => setHelpShowing(!helpShowing)}
          >
            <QuestionIcon />
          </button>
          {helpShowing && (
            <div className="help-menu">
              <ul>
                <li>
                  <label>Create Node:</label> Shift+Click
                </li>
                <li>
                  <label>Create Edge:</label> Shift+Click on node, drag mouse to
                  target node
                </li>
                {allowMultiSelect && (
                  <li>
                    <label>Select Multiple Nodes:</label> [Ctrl/Cmd]+Shift+Click
                    and drag
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GraphControls;

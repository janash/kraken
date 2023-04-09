import React from 'react';
import Plot from 'react-plotly.js';

export default function Graph({ molData, componentArray, neighborSearch }){

    const symbols = [0, 1, 2, 13, 14, 15, 16, 17, 18]
    // Still need to be genericized
    const axis_dict = {"pca1": "pc1", "pca2": "pc2", "pca3": "pc3", "pca4": "pc4", "umap1": "umap1", "umap2": "umap2"};
    const pattern_dict = {"pc3": "P[C]<sub>3</sub>", 
                        "pn3": "P[N]<sub>3</sub>", 
                        "po3": "P[O]<sub>3</sub>", 
                        "pcn": "P[C]<sub>n</sub>[N]<sub>m</sub>", 
                        "phal": "PF<sub>n</sub>[R]<sub>m</sub>", 
                        "pon": "P[O]<sub>n</sub>[N]<sub>m</sub>", 
                        "pco": "P[C]<sub>n</sub>[O]<sub>m</sub>", 
                        "psi": "P[S]<sub>n</sub>[I]<sub>m</sub>", 
                        "other": "other"}

    // Plotting functions to show molecules on hover
    function showSVGWindow(svg, event) {
    /**
     * Creates SVG window on the molecule element when hovering of a point on the plotly graph.
     * @param {string} svg Svg of the molecule.
     * @param {event} event Hover event when hovering over a point on the plotly graph.
     */

        // remove in case existing
        if (document.getElementById("molecule")) {
        document.getElementById("molecule").remove()
        }
    
        let mol = document.createElement("g")
        mol.setAttribute("id", "molecule")
        
        let plotly_container = document.getElementsByClassName("plotly")
        mol.innerHTML = svg;
        
        let xpos = event.event.clientX - 160;
        let ypos = event.event.clientY - 160;
    
        plotly_container[0].appendChild(mol);
        mol.style.position = "fixed";
        mol.style.left = `${xpos}px`;
        mol.style.top = `${ypos}px`;
        }
    
    function showSVG(event) {
    /**
     * Requests svg data for the molecule you are hovering on.
     * @param {event} event Hover even when hovering over a point on the plotly graph.
     */
    fetch(`depict/cow/svg?smi=${event.points[0].text}&w=40&h=40`).then(response => 
        response.text() ).then( body => showSVGWindow(body, event) );
    }
    
    function hideSVG() {
    /**
     * Removes molecule element which holds its SVG, when you are no longer hovering.
     */
    if (document.getElementById("molecule")) {
        document.getElementById("molecule").remove()
    }
    }
    
    /**
     * Creates plotly react graph object.
     * The x and y labels are mapped to the axis dictionary to write pc1 instead of pca1.
     */
    let myPlot = <Plot 
                    onHover={ (event) => showSVG(event) } 
                    onUnhover={ (event)=> hideSVG(event) } 
                    style={{'width': '100%', 'height': '100%' }}
                    useResizeHandler={true}
                    // Empty data to fill in later
                    data={[]}
                    layout={ {
                        autosize: true,
                        useResizeHandler: true,
                        style: {width: '100%', height: '100%'},
                        xaxis: {
                        title: {
                            text: axis_dict[molData[0].type + componentArray[0]],
                            font: {
                            size: 18,
                            color: '#7f7f7f'
                            }
                        }
                    },

                        yaxis: {
                            title: {
                            text: axis_dict[molData[0].type + componentArray[1]],
                            font: {
                                size: 18,
                                color: '#7f7f7f'
                            }
                        }
                    }
                    } }
                />
    
    let values;
    
    // Shifting the data by 1, to avoid overwriting the target of the search if we are plotting a neighbor search.
    if (neighborSearch) {
        values = molData.slice(1);
    }
    else {
        values = molData;
    }
    
    function extractPatterns(molData) {
        let patterns = new Set(molData.filter(obj => obj.hasOwnProperty("pat")).map(obj => obj["pat"]));
        return patterns;
    }

    let pats = extractPatterns(molData);

    // Fill in data for the graph
    // Loop over all the patterns we have to add them as elements to that data props.
    pats.forEach(function(element) {
        myPlot.props.data.push(                        
            // Creating the data series for each pattern
            {
                x: values.map( row => {if (row.pat == element) { return row.components[0] } }),
                y: values.map( row => {if (row.pat == element) { return row.components[1] } }),
                text: values.map( row => { return encodeURIComponent(row.smiles) }),
                hovertemplate: "( %{x}, %{y})",
                hovermode: "closest",
                type: 'scatter',
                mode: 'markers',
                marker: {size: 12 ,
                        // Randomly assigning symbols from the designated ones above
                        // This causes the symbols to change on data load, which is not bueno.
                        symbol: symbols[Math.floor(Math.random() * symbols.length)],
                        line: {
                            width: 2,
                            color: 'DarkSlateGrey'}},
                name: pattern_dict[element],
            });
        }
    );

    // If we are plotting a neighbor search, we need to add the target to the data of the plot.
    if (neighborSearch) {
        myPlot.props.data.push(                        
        // Creating the data series for the target of the search using the first element in molData since that is the target
        {
        x: [molData[0].components[0]],
        y: [molData[0].components[1]],
        text: [encodeURIComponent(molData[0].smiles)],
        hovertemplate: "( %{x}, %{y})",
        hovermode: "closest",
        type: 'scatter',
        mode: 'markers',
        marker: {color: 'red', size: 12 , 
                symbol: "triangle-up",
                line: {
                    width: 2,
                    color: 'DarkSlateGrey'}},
        name: 'Target'
        });
    }

    return (
        myPlot
        );
}
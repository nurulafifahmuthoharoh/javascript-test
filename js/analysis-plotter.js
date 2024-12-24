'use strict';

/**
 * Plot result from the beam analysis calculation into a graph
 */
class AnalysisPlotter {
    constructor(container) {
        this.container = container;
    }

    /**
     * Plot equation.
     *
     * @param {Object} data 
     * @param {string} label 
     * @param {Array} xValues 
     */
    plot(data, label, xValues, yAxisLabel) {
        const ctx = document.getElementById(this.container).getContext('2d');
    
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    
        const points = [];
        xValues.forEach((x) => {
            try {
                const result = data.equation(x);
                console.log(`x=${x}, result=`, result);
    
                if (Array.isArray(result)) {
                    points.push(...result);
                } else if (result && typeof result.x === 'number' && typeof result.y === 'number') {
                    points.push(result);
                } else {
                    console.error(`Invalid result at x=${x}:`, result);
                }
            } catch (error) {
                console.error(`Error processing x=${x}:`, error.message);
            }
        });
    
        console.log('All Points:', points);
    
        const uniquePoints = points.filter(
            (point, index, self) =>
                index === self.findIndex((p) => p.x === point.x && p.y === point.y)
        );
    
        if (uniquePoints.length === 0) {
            console.error('No valid data points for plotting.');
            return;
        }
    
        const labels = uniquePoints.map((p) => p.x.toFixed(2));
        const values = uniquePoints.map((p) => p.y);
    
        console.log('labels:', labels);
        console.log('values:', values);
    
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: label,
                        data: values,
                        borderColor: 'red',
                        borderWidth: 2,
                        fill: true,
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Span (m)',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel || 'Value',
                        },
                    },
                },
            },
        });
    }
    
}

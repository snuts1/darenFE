<script>
  import { onMount } from 'svelte';
  import { BarChartSimple, ChartTheme } from '@carbon/charts-svelte';
  import '@carbon/charts-svelte/styles.css'
  // Props
  export let tripId; // The ID of the trip
  export let participants = []; // Array of { id: number, name: string }

  // State
  let chartData = [];
  let chartOptions = {
    title: null,
    axes: {
      left: {
        title: null,
        // title: 'Net Balance (in currency units)', // We'll hide this axis
        mapsTo: 'value',
        includeZero: true, // Ensures the y-axis includes 0, good for +/- balances
        visible: true, // Hide the Y-axis

      },
      right: {
        title: null,
        // title: 'Net Balance (in currency units)', // We'll hide this axis
        mapsTo: 'value',
        includeZero: true, // Ensures the y-axis includes 0, good for +/- balances
        visible: true, // Hide the Y-axis
      },
      bottom: {
        title: null,
        mapsTo: 'group',
        scaleType: 'labels',
        // You might want to hide the X-axis title too for more minimalism:
        // title: null,
      },
    },
    height: '400px',
    width: '100%',
    theme: ChartTheme.WHITE,
    grid: { // Hide grid lines
        x: {
            enabled: false
        },
        y: {
            enabled: true,
            alignedWithAxisTicks: true
        }
    },
    legend: { // Hide the legend
        enabled: false,
        additionalItems: [{name: 'test', type:'line'}]
    },
    toolbar: { // Hide the toolbar (zoom, download, etc.)
        enabled: false
    },
    getFillColor: (datasetLabel, groupName, dataPointObject) => {
        const numericValue = dataPointObject ? dataPointObject.value : undefined;
        console.log(`getFillColor called - Group: ${groupName}, Extracted Value: ${numericValue}`);
        if (typeof numericValue === 'number') {
            if (numericValue > 0) {
                return '#4CAF50'; // A nice green
            } else if (numericValue < 0) {
                return '#f44336'; // A nice red
            }
        }
        return '#cccccc'; // Default to gray if value is zero or not a number
    },
  };

let loading = true;
let error = null;

async function fetchBalances() {
    try {
        const response = await fetch(`/api/v1/payback/trips/${tripId}/balances`);
    
        if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody.error || errorBody.message}`);
        }

        const balancesData = await response.json();
    if (!Array.isArray(balancesData)) {
        throw new Error('Balance data is not in the expected array format.');
    }
    // Transform the data for Carbon Charts
        chartData = balancesData.map(balance => ({
            group: balance.participant_name, // 'group' for the x-axis category
            value: balance.net_balance / 100,  // 'value' for the y-axis, convert cents to currency units
        }));

    } catch (err) {
      console.error('Error fetching or processing balances:', err);
      error = `Failed to load balances: ${err.message}`;
      chartData = []; // Clear data on error
    } finally {
      loading = false;
    }
  }

  // Reactive statement: Re-calculate balances when tripId or participants change
  $: if (tripId) {
    fetchBalances();
  }
export { fetchBalances };

</script>

<div class="status-chart-container">
  {#if loading}
    <p>Loading chart data...</p>
  {:else if error}
    <p class="error-message">Error loading chart: {error}</p>
  {:else if chartData.length === 0 && participants.length > 0}
    <p>No balance data to display for this trip, or all balances are zero.</p>
  {:else if participants.length === 0}
    <p>No participants in this trip to display balances for.</p>
  {:else}
    <BarChartSimple data={chartData} options={chartOptions} />
     <!-- Balance Reference Table -->
    <div class="balance-table-container">
      <table>
        <thead>
          <tr>
            {#each chartData as item (item.group)}
              <th>{item.group}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          <tr>
            {#each chartData as item (item.group)}
              <td class:positive-balance={item.value > 0} class:negative-balance={item.value < 0}>
                ${item.value.toFixed(2)}
              </td>
            {/each}
          </tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .status-chart-container {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  .error-message {
    color: red;
  }
  .balance-table-container {
    margin-top: 25px;
    overflow-x: auto;
  }
  .balance-table-container h4 {
    margin-bottom: 10px;
  }
  .balance-table-container table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
  }
  .balance-table-container th,
  .balance-table-container td {
    border: 1px solid #e0e0e0;
    padding: 8px;
  }
  .balance-table-container th {
    background-color: #f8f8f8;
  }
  .positive-balance {
    color: #4CAF50; /* Green */
    font-weight: bold;
  }
  .negative-balance {
    color: #F44336; /* Red */
    font-weight: bold;
  }
</style>
<script>
  import { onMount } from 'svelte';

  // Props
  export let tripId; // The ID of the trip to fetch purchases for

  // State
  let purchases = []; // Array to hold the fetched purchase data
  let loading = true; // Boolean to indicate if data is being fetched
  let error = null; // String to hold any error message

  // Function to fetch purchases
  async function fetchPurchases() {
    loading = true;
    error = null; // Clear previous errors
    purchases = []; // Clear previous data

    try {
      const response = await fetch(`/api/v1/payback/trips/${tripId}/purchases`);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorBody.error || errorBody.message}`);
        }

      const data = await response.json();
      purchases = data; // Assuming the API returns an array of purchase objects

    } catch (err) {
      console.error('Error fetching purchases:', err);
      error = `Failed to load purchases: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  // Fetch data when the component mounts
  onMount(() => {
    fetchPurchases();
  });
  $: if (tripId) {
    fetchPurchases();
  }
  // Expose the fetch function so the parent can trigger a refresh
  export { fetchPurchases };

</script>

<div class="purchase-log">
  {#if loading}
    <p>Loading purchases...</p>
  {:else if error}
    <p class="error-message">{error}</p>
  {:else if !purchases}
    <p>No purchases recorded for this trip yet.</p>
  {:else}
    <ul class="purchase-list">
        {#each purchases as purchase (purchase.id)}
           <li class="purchase-item">
            <span class="payer-name">{purchase.payer_name || 'Unknown Payer'}</span> paid 
            <span class="amount">${(purchase.total_amount / 100).toFixed(2)}</span>
            {#if purchase.recipient_names && purchase.recipient_names.length > 0}
                <span class="recipients-info">
                    &#8594 {purchase.recipient_names.join(', ')}
                </span>
            {/if}
            <span class="description">: {purchase.description}</span>          
           </li>
        {/each}
    </ul>
  {/if}
</div>

<style>
  .purchase-log {
    margin-top: 0em;
    border-top: 1px solid #eee;
    padding-top: 0em;
  }
  .purchase-log h3 {
    margin-top: 0;
    font-size: 1.5em;
  }
 .purchase-list {
    list-style-type: none;
    padding: 0;
  }
  .error-message {
    color: red;
  } 
.purchase-date {
    font-size: 0.9em;
    color: #666;
    margin-right: 5px;
  }
  .payer-name, .description, .amount {
    font-weight: bold;
  }
  .description {
    font-style: italic;
  }
    .purchase-item {
    padding: 10px 0;
    border-bottom: 1px solid #353535; /* Divider line */
  }
</style>
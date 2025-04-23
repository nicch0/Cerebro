<script lang="ts">
import { getMessages } from "./context.svelte";

let messages = getMessages();

</script>

<div>
{#each messages as message, index}
<p>{index}: {message}</p>
{/each}
</div>

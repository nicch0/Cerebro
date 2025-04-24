<script lang="ts">
import { getMessages } from "./messages.svelte";
import Message from "./Message.svelte";

let messages = getMessages();

</script>

<div>
{#each messages as message}
    <Message
        message={message}
    />
{/each}
</div>

<script lang="ts">
import type { Message } from "@/types";

interface Props {
    message: Message;
}

let { message }: Props = $props();
</script>

<p>{message.role}: { message.content}</p>

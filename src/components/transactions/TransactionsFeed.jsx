import { useEffect, useRef } from "react";
import { C } from "../../utils/colors.js";
import TransactionRow from "./TransactionRow.jsx";

export default function TransactionsFeed({
  transactions,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyText,
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loadingMore) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore?.();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore, transactions.length]);

  if (!transactions.length && !loadingMore) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: "var(--text-sm)" }}>
        {emptyText}
      </div>
    );
  }

  return (
    <>
      {transactions.map((tx) => <TransactionRow key={tx._id || `${tx.date}-${tx.description}`} tx={tx} />)}
      {loadingMore && (
        <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: "var(--text-sm)" }}>
          Cargando más movimientos...
        </div>
      )}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </>
  );
}

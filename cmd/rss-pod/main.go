package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"github.com/synrise25/rss-pod/internal/app"
	"github.com/synrise25/rss-pod/internal/checker"
	"github.com/synrise25/rss-pod/internal/config"
	"github.com/synrise25/rss-pod/internal/jobs"
)

func main() {
	if err := run(); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return
		}
		slog.Error("command failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
	_ = godotenv.Load()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if len(os.Args) < 2 {
		usage()
		return errors.New("missing command")
	}

	switch os.Args[1] {
	case "check":
		return runCheck(ctx, os.Args[2:])
	case "migrate":
		return runMigrate(ctx, os.Args[2:])
	case "poll":
		return runPoll(ctx, os.Args[2:])
	case "start":
		return runStart(ctx, os.Args[2:])
	case "retry":
		return runRetry(ctx, os.Args[2:])
	case "stop":
		return runStop(ctx, os.Args[2:])
	case "delete":
		return runDelete(ctx, os.Args[2:])
	case "serve":
		return runServe(ctx, os.Args[2:])
	case "worker":
		return runWorker(ctx, os.Args[2:])
	case "run":
		return runCombined(ctx, os.Args[2:])
	case "help", "-h", "--help":
		usage()
		return nil
	default:
		usage()
		return fmt.Errorf("unknown command %q", os.Args[1])
	}
}

func loadConfig(args []string, command string) (*config.Config, error) {
	flags := flag.NewFlagSet(command, flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	if err := flags.Parse(args); err != nil {
		return nil, err
	}
	return config.Load(*configPath)
}

func runMigrate(ctx context.Context, args []string) error {
	cfg, err := loadConfig(args, "migrate")
	if err != nil {
		return err
	}
	if err := app.Migrate(ctx, cfg); err != nil {
		return err
	}
	slog.Info("database migrations complete")
	return nil
}

func runServe(ctx context.Context, args []string) error {
	cfg, err := loadConfig(args, "serve")
	if err != nil {
		return err
	}
	return app.Serve(ctx, cfg)
}

func runWorker(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("worker", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	queuesValue := flags.String("queues", "", "comma-separated queues; defaults to all configured queues")
	if err := flags.Parse(args); err != nil {
		return err
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}
	queues, err := app.ParseQueues(cfg, *queuesValue)
	if err != nil {
		return err
	}
	return app.Worker(ctx, cfg, queues)
}

func runCombined(ctx context.Context, args []string) error {
	cfg, err := loadConfig(args, "run")
	if err != nil {
		return err
	}
	return app.Run(ctx, cfg)
}

func runPoll(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("poll", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	sourcesValue := flags.String("sources", "", "comma-separated source IDs, or all")
	times := flags.Int("times", 1, "number of polls to enqueue per source")
	limit := flags.Int("limit", 0, "maximum feed items per poll; zero uses each source configuration")
	jsonOutput := flags.Bool("json", false, "print JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}
	sources, err := app.ParsePollSources(cfg, *sourcesValue)
	if err != nil {
		return err
	}
	queued, err := app.EnqueuePolls(ctx, cfg, sources, *times, *limit)
	if err != nil {
		return err
	}
	if *jsonOutput {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(queued)
	}
	for _, poll := range queued {
		fmt.Printf("queued source=%s number=%d run_id=%s job_id=%d\n", poll.SourceID, poll.Number, poll.RunID, poll.JobID)
	}
	return nil
}

func runStart(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("start", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	episodesValue := flags.String("episode", "", "comma-separated episode IDs")
	sourcesValue := flags.String("sources", "", "comma-separated poll-only source IDs, or all")
	limit := flags.Int("limit", 50, "maximum waiting episodes to start")
	jsonOutput := flags.Bool("json", false, "print JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if (*episodesValue == "") == (*sourcesValue == "") {
		return errors.New("exactly one of --episode or --sources is required")
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}

	var started []jobs.StartedEpisode
	if *episodesValue != "" {
		episodeIDs, err := parseEpisodeIDs(*episodesValue)
		if err != nil {
			return err
		}
		started, err = app.StartEpisodes(ctx, cfg, episodeIDs)
		if err != nil {
			return err
		}
	} else {
		sources, err := app.ParsePollOnlySources(cfg, *sourcesValue)
		if err != nil {
			return err
		}
		started, err = app.StartWaitingEpisodes(ctx, cfg, sources, *limit)
		if err != nil {
			return err
		}
	}

	if *jsonOutput {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(started)
	}
	for _, episode := range started {
		fmt.Printf("started episode=%s job=%s job_id=%d\n", episode.EpisodeID, episode.JobKind, episode.JobID)
	}
	if len(started) == 0 {
		fmt.Println("no waiting episodes found")
	}
	return nil
}

// parseEpisodeIDs reads a comma-separated episode ID list, ignoring duplicates.
func parseEpisodeIDs(value string) ([]uuid.UUID, error) {
	seen := make(map[uuid.UUID]struct{})
	episodeIDs := make([]uuid.UUID, 0)
	for _, item := range strings.Split(value, ",") {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		episodeID, err := uuid.Parse(item)
		if err != nil {
			return nil, fmt.Errorf("invalid episode ID %q", item)
		}
		if _, duplicate := seen[episodeID]; duplicate {
			continue
		}
		seen[episodeID] = struct{}{}
		episodeIDs = append(episodeIDs, episodeID)
	}
	if len(episodeIDs) == 0 {
		return nil, errors.New("--episode must contain at least one episode ID")
	}
	return episodeIDs, nil
}

func runRetry(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("retry", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	sourcesValue := flags.String("sources", "", "comma-separated source IDs, or all")
	limit := flags.Int("limit", 50, "maximum failed episodes to re-queue")
	jsonOutput := flags.Bool("json", false, "print JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}
	sources, err := app.ParsePollSources(cfg, *sourcesValue)
	if err != nil {
		return err
	}
	retried, err := app.RetryFailedEpisodes(ctx, cfg, sources, *limit)
	if err != nil {
		return err
	}
	if *jsonOutput {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(retried)
	}
	for _, episode := range retried {
		fmt.Printf("retried episode=%s job=%s job_id=%d\n", episode.EpisodeID, episode.JobKind, episode.JobID)
	}
	if len(retried) == 0 {
		fmt.Println("no failed episodes found")
	}
	return nil
}

func runStop(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("stop", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	jsonOutput := flags.Bool("json", false, "print JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}
	result, err := app.StopRunningTasks(ctx, cfg)
	if err != nil {
		return err
	}
	if *jsonOutput {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(result)
	}
	fmt.Printf("stopped jobs=%d episodes=%d runs=%d\n", result.CancelledJobs, result.FailedEpisodes, result.FailedRuns)
	return nil
}

func runDelete(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("delete", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	sourcesValue := flags.String("sources", "", "comma-separated source IDs, or all")
	limit := flags.Int("limit", 200, "maximum failed episodes to delete")
	dryRun := flags.Bool("dry-run", false, "report what would be deleted without deleting")
	includeWaiting := flags.Bool("include-waiting", false, "also delete poll-only episodes waiting for a start")
	ignore := flags.Bool("ignore", false, "remember deleted items so later polls skip them")
	listIgnored := flags.Bool("list-ignored", false, "list remembered items instead of deleting")
	unignore := flags.Bool("unignore", false, "forget remembered items instead of deleting")
	jsonOutput := flags.Bool("json", false, "print JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if *listIgnored && *unignore {
		return errors.New("--list-ignored and --unignore cannot be combined")
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}
	sources, err := app.ParsePollSources(cfg, *sourcesValue)
	if err != nil {
		return err
	}

	if *listIgnored {
		items, err := app.ListIgnoredFeedItems(ctx, cfg, sources, *limit)
		if err != nil {
			return err
		}
		if *jsonOutput {
			encoder := json.NewEncoder(os.Stdout)
			encoder.SetIndent("", "  ")
			return encoder.Encode(items)
		}
		for _, item := range items {
			fmt.Printf("%s %s %s\n", item.SourceID, item.ExternalID, item.Title)
		}
		fmt.Printf("ignored=%d\n", len(items))
		return nil
	}
	if *unignore {
		forgot, err := app.ForgetIgnoredFeedItems(ctx, cfg, sources, *dryRun)
		if err != nil {
			return err
		}
		if *dryRun {
			fmt.Printf("would forget=%d\n", forgot)
			return nil
		}
		fmt.Printf("forgot=%d\n", forgot)
		return nil
	}

	result, err := app.DeleteFailedTasks(ctx, cfg, sources, app.DeleteFailedTasksOptions{
		Limit:          *limit,
		DryRun:         *dryRun,
		Ignore:         *ignore,
		IncludeWaiting: *includeWaiting,
	})
	if err != nil {
		return err
	}
	if *jsonOutput {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(result)
	}
	verb := "deleted"
	if result.DryRun {
		verb = "would delete"
	}
	fmt.Printf("%s episodes=%d feed_items=%d objects=%d jobs=%d runs=%d ignored=%d\n",
		verb, result.Episodes, result.FeedItems, result.Objects, result.Jobs, result.Runs, result.Ignored)
	if !*ignore && !*dryRun && result.Episodes > 0 {
		fmt.Println("hint: pass --ignore to skip these items in later polls")
	}
	return nil
}

func runCheck(ctx context.Context, args []string) error {
	flags := flag.NewFlagSet("check", flag.ContinueOnError)
	configPath := flags.String("config", "config.yaml", "configuration file")
	jsonOutput := flags.Bool("json", false, "print JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	cfg, err := config.Load(*configPath)
	if err != nil {
		return err
	}
	results := checker.Run(ctx, cfg)
	if *jsonOutput {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(results); err != nil {
			return err
		}
	} else {
		for _, result := range results {
			status := "OK"
			if !result.OK {
				status = "FAIL"
			}
			fmt.Printf("%-8s %-5s %s (%s)\n", result.Name, status, result.Detail, result.Duration.Round(1_000_000))
		}
	}
	if !checker.AllOK(results) {
		return errors.New("one or more infrastructure checks failed")
	}
	return nil
}

func usage() {
	fmt.Fprintln(os.Stderr, `rss-pod commands:
  check    validate configuration and external services
  migrate  apply River and application database migrations
  poll     explicitly enqueue one or more source polls
  start    start episodes a poll-only source left waiting for a listener
  retry    re-queue failed episodes at the stage that failed
  stop     cancel every in-flight job and stop their work
  delete   purge failed episodes, their content, and poll records
  serve    run the HTTP service only
  worker   run selected River queues only
  run      run the HTTP service and all River queues`)
}

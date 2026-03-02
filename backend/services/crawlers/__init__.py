from services.crawlers.base import ATSCrawler, CrawlResult, RawJobListing
from services.crawlers.greenhouse import GreenhouseCrawler
from services.crawlers.lever import LeverCrawler
from services.crawlers.ashby import AshbyCrawler
from services.crawlers.smartrecruiters import SmartRecruitersCrawler
from services.crawlers.workday import WorkdayCrawler

CRAWLER_REGISTRY: dict[str, type[ATSCrawler]] = {
    "greenhouse": GreenhouseCrawler,
    "lever": LeverCrawler,
    "ashby": AshbyCrawler,
    "smartrecruiters": SmartRecruitersCrawler,
    "workday": WorkdayCrawler,
}

__all__ = [
    "ATSCrawler",
    "CrawlResult",
    "CRAWLER_REGISTRY",
    "RawJobListing",
    "GreenhouseCrawler",
    "LeverCrawler",
    "AshbyCrawler",
    "SmartRecruitersCrawler",
    "WorkdayCrawler",
]

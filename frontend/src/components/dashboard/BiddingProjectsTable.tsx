import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, MapPin, Clock, AlertCircle } from 'lucide-react';
import type { BiddingProject } from '@/types/dashboard.types';
import { format } from 'date-fns';

interface BiddingProjectsTableProps {
  projects: BiddingProject[];
  loading?: boolean;
}

export function BiddingProjectsTable({ projects, loading }: BiddingProjectsTableProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getUrgencyBadge = (urgencyLevel: string, displayText: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary'> = {
      urgent: 'destructive',
      moderate: 'default',
      plenty: 'secondary',
    };

    return (
      <Badge variant={variants[urgencyLevel] || 'secondary'} className="font-mono">
        <Clock className="h-3 w-3 mr-1" />
        {displayText}
      </Badge>
    );
  };

  const getSetAsideBadge = (setAside: string) => {
    const colors: Record<string, string> = {
      none: 'bg-gray-100 text-gray-800',
      small_business: 'bg-blue-100 text-blue-800',
      minority_owned: 'bg-purple-100 text-purple-800',
      woman_owned: 'bg-pink-100 text-pink-800',
      veteran_owned: 'bg-green-100 text-green-800',
      disadvantaged: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<string, string> = {
      none: 'None',
      small_business: 'Small Business',
      minority_owned: 'Minority Owned',
      woman_owned: 'Woman Owned',
      veteran_owned: 'Veteran Owned',
      disadvantaged: 'Disadvantaged',
    };

    return (
      <Badge className={colors[setAside] || colors.none}>
        {labels[setAside] || setAside}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects Currently Bidding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects Currently Bidding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No projects currently in bidding stage</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Projects Currently Bidding</span>
          <Badge variant="outline" className="text-lg">
            {projects.length} Projects
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Set Aside</TableHead>
                <TableHead>Bid Title</TableHead>
                <TableHead>Solicitation #</TableHead>
                <TableHead>Site Visit</TableHead>
                <TableHead>Bid Due</TableHead>
                <TableHead>Countdown</TableHead>
                <TableHead>RFI Due</TableHead>
                <TableHead className="text-right">Magnitude</TableHead>
                <TableHead>NAICS</TableHead>
                <TableHead>POP</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Capacity %</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{project.agency}</TableCell>
                  <TableCell>{getSetAsideBadge(project.setAside)}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={project.bidTitle}>
                      {project.bidTitle}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {project.solicitationNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.siteVisitDateTime ? (
                      <div>
                        <div>{format(new Date(project.siteVisitDateTime), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(project.siteVisitDateTime), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">TBD</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.bidDueDateTime ? (
                      <div>
                        <div>{format(new Date(project.bidDueDateTime), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(project.bidDueDateTime), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">TBD</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getUrgencyBadge(
                      project.urgencyLevel,
                      project.daysUntilDue >= 0
                        ? project.daysUntilDue === 0
                          ? `${project.hoursUntilDue}h`
                          : project.daysUntilDue < 7
                          ? `${project.daysUntilDue}d ${project.hoursUntilDue}h`
                          : `${project.daysUntilDue} days`
                        : 'OVERDUE'
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.rfiDueDateTime ? (
                      <div>
                        <div>{format(new Date(project.rfiDueDateTime), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(project.rfiDueDateTime), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${(project.magnitude / 1000000).toFixed(1)}M
                  </TableCell>
                  <TableCell className="font-mono text-sm">{project.naicsCode}</TableCell>
                  <TableCell className="text-sm">{project.periodOfPerformance}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {project.projectCity}, {project.projectState}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        project.capacityPercentage > 100
                          ? 'destructive'
                          : project.capacityPercentage > 80
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {project.capacityPercentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.webLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <a
                          href={project.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on SAM.gov"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
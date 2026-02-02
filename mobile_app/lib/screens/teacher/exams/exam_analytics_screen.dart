import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../widgets/common/loading_widget.dart';

class ExamAnalyticsScreen extends StatefulWidget {
  const ExamAnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<ExamAnalyticsScreen> createState() => _ExamAnalyticsScreenState();
}

class _ExamAnalyticsScreenState extends State<ExamAnalyticsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _overallStats;
  List<dynamic> _subjectAnalytics = [];
  List<dynamic> _topPerformers = [];

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/exam-analytics');
      if (response['success'] == true) {
        setState(() {
          _overallStats = response['overallStats'];
          _subjectAnalytics = response['subjectAnalytics'] ?? [];
          _topPerformers = response['topPerformers'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching analytics: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Analytics'),
        elevation: 0,
      ),
      body: _isLoading
          ? const LoadingWidget()
          : RefreshIndicator(
              onRefresh: _fetchAnalytics,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Overall Stats
                    if (_overallStats != null) _buildOverallStats(),
                    const SizedBox(height: 24),

                    // Subject Performance
                    const Text(
                      'Subject Performance',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _buildSubjectPerformance(),
                    const SizedBox(height: 24),

                    // Top Performers
                    const Text(
                      'Top Performers',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _buildTopPerformers(),
                    const SizedBox(height: 24),

                    // Insights
                    if (_overallStats != null) _buildInsights(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildOverallStats() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          'Total Exams',
          '${_overallStats!['totalExams'] ?? 0}',
          Icons.book_outlined,
          Colors.blue,
        ),
        _buildStatCard(
          'Students Evaluated',
          '${_overallStats!['totalStudentsEvaluated'] ?? 0}',
          Icons.people_outline,
          Colors.purple,
        ),
        _buildStatCard(
          'Pass Percentage',
          '${(_overallStats!['overallPassPercentage'] ?? 0).toStringAsFixed(1)}%',
          Icons.trending_up,
          Colors.green,
        ),
        _buildStatCard(
          'Average Marks',
          '${(_overallStats!['overallAverageMarks'] ?? 0).toStringAsFixed(1)}',
          Icons.analytics,
          Colors.orange,
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectPerformance() {
    if (_subjectAnalytics.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.bar_chart, size: 48, color: Colors.grey),
              SizedBox(height: 8),
              Text('No subject data available', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _subjectAnalytics.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey[200]),
        itemBuilder: (context, index) {
          final subject = _subjectAnalytics[index];
          return _buildSubjectItem(subject);
        },
      ),
    );
  }

  Widget _buildSubjectItem(Map<String, dynamic> subject) {
    final trend = subject['trend'] ?? 'stable';
    final trendValue = (subject['trendValue'] ?? 0).toDouble();
    final passPercentage = (subject['averagePassPercentage'] ?? 0).toDouble();

    Color trendColor;
    IconData trendIcon;
    switch (trend) {
      case 'up':
        trendColor = Colors.green;
        trendIcon = Icons.trending_up;
        break;
      case 'down':
        trendColor = Colors.red;
        trendIcon = Icons.trending_down;
        break;
      default:
        trendColor = Colors.grey;
        trendIcon = Icons.trending_flat;
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject['subjectName'] ?? 'Subject',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${subject['subjectCode']} • ${subject['totalExams']} exams',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  Icon(trendIcon, color: trendColor, size: 18),
                  const SizedBox(width: 4),
                  Text(
                    '${trend == 'up' ? '+' : trend == 'down' ? '-' : ''}${trendValue.toStringAsFixed(1)}%',
                    style: TextStyle(
                      color: trendColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pass %',
                      style: TextStyle(color: Colors.grey[600], fontSize: 11),
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: passPercentage / 100,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation(
                          passPercentage >= 70
                              ? Colors.green
                              : passPercentage >= 50
                                  ? Colors.orange
                                  : Colors.red,
                        ),
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Text(
                '${passPercentage.toStringAsFixed(1)}%',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Avg Marks: ${(subject['averageMarks'] ?? 0).toStringAsFixed(1)}',
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildTopPerformers() {
    if (_topPerformers.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.emoji_events, size: 48, color: Colors.grey),
              SizedBox(height: 8),
              Text('No performance data available', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _topPerformers.length > 5 ? 5 : _topPerformers.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey[200]),
        itemBuilder: (context, index) {
          final performer = _topPerformers[index];
          return _buildPerformerItem(performer, index);
        },
      ),
    );
  }

  Widget _buildPerformerItem(Map<String, dynamic> performer, int index) {
    Color rankColor;
    switch (index) {
      case 0:
        rankColor = Colors.amber;
        break;
      case 1:
        rankColor = Colors.grey;
        break;
      case 2:
        rankColor = Colors.brown;
        break;
      default:
        rankColor = Colors.grey[400]!;
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rankColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: rankColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  performer['studentName'] ?? 'Student',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${performer['admissionNumber']} • ${performer['totalExams']} exams',
                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${(performer['averageMarks'] ?? 0).toStringAsFixed(1)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              Text(
                'Avg Marks',
                style: TextStyle(color: Colors.grey[600], fontSize: 10),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInsights() {
    final topSubject = _overallStats!['topPerformingSubject'];
    final needsImprovement = _overallStats!['needsImprovementSubject'];

    if (topSubject == null && needsImprovement == null) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Key Insights',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (topSubject != null && topSubject.isNotEmpty)
          _buildInsightCard(
            'Top Performing Subject',
            '$topSubject has the highest pass rate among your subjects.',
            Icons.trending_up,
            Colors.green,
          ),
        if (needsImprovement != null && needsImprovement.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInsightCard(
            'Needs Improvement',
            '$needsImprovement has the lowest pass rate. Consider additional support.',
            Icons.trending_down,
            Colors.orange,
          ),
        ],
      ],
    );
  }

  Widget _buildInsightCard(String title, String description, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(color: color.withOpacity(0.8), fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
